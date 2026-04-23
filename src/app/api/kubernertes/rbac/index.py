import logging
from fastapi import Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class CreateAccessBody(BaseModel):
    service_account_name: str
    namespace: str = "default"
    role_template: str = "developer"
    token_expiry_hours: int = 168
    description: str = ""
    custom_rules: Optional[list] = None  # Only used when role_template == "custom"


class UpdateAccessBody(BaseModel):
    action: str = "regenerate_token"
    role_template: Optional[str] = None


async def GET(request: Request, namespace: str = "default"):
    try:
        from app.db_client.db import get_session
        from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import list_access
        
        with get_session() as session:
            accesses = list_access(session, namespace=namespace, include_inactive=True)
        
        users = []
        for access in accesses:
            users.append({
                "id": access.id,
                "name": access.service_account_name,
                "namespace": access.namespace,
                "description": access.description or "",
                "created_at": access.created_at.isoformat() if access.created_at else None,
                "age": _calculate_age(access.created_at) if access.created_at else None,
                "role_template": access.role_template,
                "expires_at": access.expires_at.isoformat() if access.expires_at else None,
                "is_active": access.is_active,
                "revoked_at": access.revoked_at.isoformat() if access.revoked_at else None,
                "status": access.status,
                "error_message": access.error_message,
                "custom_rules": access.custom_rules  # JSON string, None for standard templates
            })
        
        return JSONResponse(content={
            "users": users,
            "namespace": namespace,
            "total": len(users)
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


async def POST(request: Request, body: CreateAccessBody, background_tasks: BackgroundTasks):
    try:
        logger.info(f"Creating access for SA: {body.service_account_name}, namespace: {body.namespace}, role_template: {body.role_template}")
        
        from app.db_client.db import get_session
        from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import get_access_by_sa, create_access, update_access
        
        with get_session() as session:
            existing = get_access_by_sa(session, body.service_account_name, body.namespace)
            if existing and existing.is_active:
                if existing.status == "ready":
                    return JSONResponse(status_code=409, content={
                        "error": f"Service account '{body.service_account_name}' already exists in namespace '{body.namespace}'",
                        "existing_id": existing.id
                    })
                elif existing.status == "pending":
                    return JSONResponse(status_code=409, content={
                        "error": f"Service account '{body.service_account_name}' has a pending request in namespace '{body.namespace}'",
                        "existing_id": existing.id
                    })
                elif existing.status == "failed":
                    logger.info(f"Found failed record for {body.service_account_name}, will retry")
                    existing.status = "pending"
                    existing.error_message = None
                    session.add(existing)
                    session.commit()
                    session.refresh(existing)
                    access_id = existing.id
                    
                    def retry_task(
                        access_id: int,
                        service_account_name: str,
                        namespace: str,
                        role_template: str,
                        token_expiry_hours: int,
                        custom_rules_json: Optional[str] = None,
                        retry_count: int = 0
                    ):
                        from app.k8s_helper.core.kubeconfig_generator import KubeconfigGenerator
                        from app.db_client.db import get_session
                        from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import update_access
                        from app.utils.get_fernet import get_fernet
                        import json
                        import logging
                        logger = logging.getLogger(__name__)
                        MAX_RETRIES = 3
                        
                        try:
                            import json as _json
                            generator = KubeconfigGenerator()
                            _custom_rules = _json.loads(custom_rules_json) if custom_rules_json else None
                            
                            k8s_result = generator.generate(
                                service_account_name=service_account_name,
                                namespace=namespace,
                                role_template=role_template,
                                custom_role_rules=_custom_rules,
                                token_expiry_hours=token_expiry_hours
                            )
                            
                            kubeconfig_json = json.dumps(k8s_result["kubeconfig"])
                            
                            f = get_fernet()
                            if f:
                                kubeconfig_encrypted = f.encrypt(kubeconfig_json.encode()).decode()
                            else:
                                kubeconfig_encrypted = kubeconfig_json
                            
                            with get_session() as session:
                                update_access(
                                    session=session,
                                    access_id=access_id,
                                    status="ready",
                                    kubeconfig_encrypted=kubeconfig_encrypted
                                )
                            
                            logger.info(f"Kubeconfig generated and saved for access_id: {access_id}")
                            
                        except Exception as e:
                            error_msg = str(e)
                            logger.error(f"Background task failed (attempt {retry_count + 1}): {error_msg}")
                            
                            if "already exists" in error_msg.lower():
                                logger.info(f"SA exists in K8s - marking as failed")
                                with get_session() as session:
                                    update_access(
                                        session=session,
                                        access_id=access_id,
                                        status="failed",
                                        error_message="ServiceAccount already exists in Kubernetes"
                                    )
                                return
                            
                            if retry_count < MAX_RETRIES - 1:
                                logger.info(f"Retrying... ({retry_count + 2}/{MAX_RETRIES})")
                                import time
                                time.sleep(5 * (retry_count + 1))
                                retry_task(
                                    access_id=access_id,
                                    service_account_name=service_account_name,
                                    namespace=namespace,
                                    role_template=role_template,
                                    token_expiry_hours=token_expiry_hours,
                                    custom_rules_json=custom_rules_json,
                                    retry_count=retry_count + 1
                                )
                            else:
                                logger.error(f"All retries exhausted for access_id: {access_id}")
                                try:
                                    with get_session() as session:
                                        update_access(
                                            session=session,
                                            access_id=access_id,
                                            status="failed",
                                            error_message=str(e)[:500]
                                        )
                                except:
                                    pass
                    
                    import json as _json
                    _custom_rules_json = _json.dumps(body.custom_rules) if body.custom_rules else None
                    background_tasks.add_task(
                        retry_task,
                        access_id,
                        body.service_account_name,
                        body.namespace,
                        body.role_template,
                        body.token_expiry_hours,
                        _custom_rules_json
                    )
                    
                    expires_at = datetime.utcnow() + timedelta(hours=body.token_expiry_hours)
                    return JSONResponse(content={
                        "id": access_id,
                        "service_account": body.service_account_name,
                        "namespace": body.namespace,
                        "role_template": body.role_template,
                        "token_expiry_hours": body.token_expiry_hours,
                        "expires_at": expires_at.isoformat(),
                        "status": "pending",
                        "message": "Retrying failed request..."
                    })
        
        from app.k8s_helper.core.kubeconfig_generator import KubeconfigGenerator
        generator = KubeconfigGenerator()
        
        expires_at = datetime.utcnow() + timedelta(hours=body.token_expiry_hours)
        
        import json as _json
        _custom_rules_json = _json.dumps(body.custom_rules) if body.custom_rules else None
        
        with get_session() as session:
            db_access = create_access(
                session=session,
                service_account_name=body.service_account_name,
                namespace=body.namespace,
                role_template=body.role_template,
                description=body.description,
                created_by="admin",
                expires_at=expires_at,
                kubeconfig_cluster="default",
                status="pending",
                custom_rules=_custom_rules_json
            )
            access_id = db_access.id
        
        MAX_RETRIES = 3
        
        def generate_kubeconfig_task(
            access_id: int,
            service_account_name: str,
            namespace: str,
            role_template: str,
            token_expiry_hours: int,
            custom_rules_json: Optional[str] = None,
            retry_count: int = 0
        ):
            from app.k8s_helper.core.kubeconfig_generator import KubeconfigGenerator
            from app.db_client.db import get_session
            from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import update_access
            from app.utils.get_fernet import get_fernet
            import json
            
            try:
                import json as _json
                generator = KubeconfigGenerator()
                _custom_rules = _json.loads(custom_rules_json) if custom_rules_json else None
                
                k8s_result = generator.generate(
                    service_account_name=service_account_name,
                    namespace=namespace,
                    role_template=role_template,
                    custom_role_rules=_custom_rules,
                    token_expiry_hours=token_expiry_hours
                )
                
                kubeconfig_json = json.dumps(k8s_result["kubeconfig"])
                
                f = get_fernet()
                if f:
                    kubeconfig_encrypted = f.encrypt(kubeconfig_json.encode()).decode()
                else:
                    kubeconfig_encrypted = kubeconfig_json
                
                with get_session() as session:
                    update_access(
                        session=session,
                        access_id=access_id,
                        status="ready",
                        kubeconfig_encrypted=kubeconfig_encrypted
                    )
                
                logger.info(f"Kubeconfig generated and saved for access_id: {access_id}")
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Background task failed (attempt {retry_count + 1}): {error_msg}")
                
                if "already exists" in error_msg.lower():
                    logger.info(f"SA exists in K8s - marking as failed with existing SA error")
                    with get_session() as session:
                        update_access(
                            session=session,
                            access_id=access_id,
                            status="failed",
                            error_message="ServiceAccount already exists in Kubernetes. Use existing record or delete K8s SA first."
                        )
                    return
                
                if retry_count < MAX_RETRIES - 1:
                    logger.info(f"Retrying... ({retry_count + 2}/{MAX_RETRIES})")
                    import time
                    time.sleep(5 * (retry_count + 1))
                    
                    generate_kubeconfig_task(
                        access_id=access_id,
                        service_account_name=service_account_name,
                        namespace=namespace,
                        role_template=role_template,
                        token_expiry_hours=token_expiry_hours,
                        custom_rules_json=custom_rules_json,
                        retry_count=retry_count + 1
                    )
                else:
                    logger.error(f"All retries exhausted for access_id: {access_id}")
                    from app.db_client.db import get_session
                    from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import update_access
                    try:
                        with get_session() as session:
                            update_access(
                                session=session,
                                access_id=access_id,
                                status="failed",
                                error_message=str(e)[:500]
                            )
                    except:
                        pass
        
        background_tasks.add_task(
            generate_kubeconfig_task,
            access_id,
            body.service_account_name,
            body.namespace,
            body.role_template,
            body.token_expiry_hours,
            _custom_rules_json
        )
        
        return JSONResponse(content={
            "id": access_id,
            "service_account": body.service_account_name,
            "namespace": body.namespace,
            "role_template": body.role_template,
            "token_expiry_hours": body.token_expiry_hours,
            "expires_at": expires_at.isoformat(),
            "status": "pending",
            "message": "Kubeconfig is being generated in the background. Use the download endpoint to retrieve it once ready."
        })
    except Exception as e:
        logger.error(f"Error creating access: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})


def _calculate_age(created_at) -> str:
    if not created_at:
        return "Unknown"
    now = datetime.utcnow()
    delta = now - created_at
    days = delta.days
    if days > 30:
        return f"{days // 30}mo"
    elif days > 0:
        return f"{days}d"
    elif delta.seconds > 3600:
        return f"{delta.seconds // 3600}h"
    elif delta.seconds > 60:
        return f"{delta.seconds // 60}m"
    else:
        return f"{delta.seconds}s"


async def DOWNLOAD(request: Request, access_id: int):
    try:
        from app.db_client.db import get_session
        from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import get_access
        from app.utils.get_fernet import get_fernet
        import json
        import yaml
        
        with get_session() as session:
            access = get_access(session, access_id)
        
        if not access:
            return JSONResponse(status_code=404, content={"error": "Access not found"})
        
        if access.status != "ready":
            return JSONResponse(status_code=400, content={
                "error": f"Kubeconfig not ready",
                "current_status": access.status
            })
        
        kubeconfig_json = access.kubeconfig_encrypted
        
        f = get_fernet()
        if f:
            try:
                kubeconfig_json = f.decrypt(kubeconfig_json.encode()).decode()
            except:
                pass
        
        kubeconfig = json.loads(kubeconfig_json)
        kubeconfig_yaml = yaml.dump(kubeconfig, default_flow_style=False)
        
        return JSONResponse(content={
            "id": access.id,
            "service_account": access.service_account_name,
            "namespace": access.namespace,
            "role_template": access.role_template,
            "kubeconfig": kubeconfig,
            "kubeconfig_yaml": kubeconfig_yaml
        })
    except Exception as e:
        logger.error(f"Error downloading kubeconfig: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": str(e)})