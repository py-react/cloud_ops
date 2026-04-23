from fastapi import Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from fastapi.responses import JSONResponse


class UpdateAccessBody(BaseModel):
    action: str = "regenerate_token"
    role_template: Optional[str] = None
    custom_rules: Optional[list] = None  # Provided when action="change_role" with a custom template


async def GET(request: Request, id: int):
    try:
        from app.db_client.db import get_session
        from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import get_access
        from app.utils.get_fernet import get_fernet
        import json
        
        with get_session() as session:
            access = get_access(session, id)
        
        if not access:
            return JSONResponse(status_code=404, content={"error": "User access not found"})
        
        response_data = {
            "id": access.id,
            "name": access.service_account_name,
            "namespace": access.namespace,
            "description": access.description or "",
            "role_template": access.role_template,
            "created_by": access.created_by,
            "created_at": access.created_at.isoformat() if access.created_at else None,
            "expires_at": access.expires_at.isoformat() if access.expires_at else None,
            "is_active": access.is_active,
            "revoked_at": access.revoked_at.isoformat() if access.revoked_at else None,
            "status": access.status,
            "error_message": access.error_message
        }
        
        if access.status == "ready" and access.kubeconfig_encrypted:
            kubeconfig_json = access.kubeconfig_encrypted
            f = get_fernet()
            if f:
                try:
                    kubeconfig_json = f.decrypt(kubeconfig_json.encode()).decode()
                except:
                    pass
            try:
                response_data["kubeconfig"] = json.loads(kubeconfig_json)
            except:
                pass
        
        return JSONResponse(content=response_data)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


async def PUT(request: Request, id: int, body: UpdateAccessBody, background_tasks: BackgroundTasks):
    try:
        from app.db_client.db import get_session
        from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import get_access, update_access
        import logging
        logger = logging.getLogger(__name__)
        
        with get_session() as session:
            access = get_access(session, id)
        
        if not access:
            return JSONResponse(status_code=404, content={"error": "User access not found"})
        
        service_account_name = access.service_account_name
        namespace = access.namespace
        role_template = access.role_template
        
        from app.k8s_helper.core.kubeconfig_generator import KubeconfigGenerator
        generator = KubeconfigGenerator()
        
        if body.action == "retry":
            if access.status != "failed":
                return JSONResponse(status_code=400, content={
                    "error": f"Cannot retry - current status is '{access.status}', only failed items can be retried"
                })
            
            logger.info(f"Retrying kubeconfig generation for access_id: {id}")
            
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
                            kubeconfig_encrypted=kubeconfig_encrypted,
                            error_message=None
                        )
                    
                    logger.info(f"Kubeconfig regenerated for access_id: {access_id}")
                    
                except Exception as e:
                    MAX_RETRIES = 3
                    
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
            
            from datetime import datetime, timedelta
            expires_at = access.expires_at if access.expires_at else datetime.utcnow() + timedelta(hours=168)
            hours_remaining = (expires_at - datetime.utcnow()).total_seconds() / 3600
            token_expiry_hours = int(hours_remaining) if hours_remaining > 0 else 168
            
            with get_session() as session:
                update_access(session=session, access_id=id, status="pending", error_message=None)
            
            background_tasks.add_task(
                retry_task,
                id,
                service_account_name,
                namespace,
                role_template,
                token_expiry_hours,
                access.custom_rules  # pass stored custom rules
            )
            
            return JSONResponse(content={
                "id": id,
                "service_account": service_account_name,
                "namespace": namespace,
                "status": "pending",
                "message": "Retry initiated. Check back for ready status."
            })
        
        elif body.action == "regenerate_token":
            if access.is_active:
                return JSONResponse(status_code=400, content={"error": "Access is already active"})
            
            from app.db_client.db import get_session
            from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import update_access
            with get_session() as session:
                update_access(session, id, status="regenerating", error_message=None)
            
            def regenerate_task(access_id: int, service_account_name: str, namespace: str, role_template: str):
                from app.db_client.db import get_session
                from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import update_access
                from app.k8s_helper.core.kubeconfig_generator import KubeconfigGenerator
                from app.utils.get_fernet import get_fernet
                from datetime import datetime, timedelta
                import json
                import logging
                logger = logging.getLogger(__name__)
                
                try:
                    import json as _json
                    generator = KubeconfigGenerator()
                    _custom_rules = _json.loads(access.custom_rules) if access.custom_rules else None
                    token_data = generator.regenerate_token(
                        service_account_name=service_account_name,
                        namespace=namespace,
                        role_template=role_template,
                        token_expiry_hours=168,
                        custom_role_rules=_custom_rules
                    )
                    
                    new_expiry = datetime.utcnow() + timedelta(hours=168)
                    
                    kubeconfig_json = json.dumps(token_data["kubeconfig"])
                    f = get_fernet()
                    if f:
                        kubeconfig_encrypted = f.encrypt(kubeconfig_json.encode()).decode()
                    else:
                        kubeconfig_encrypted = kubeconfig_json
                    
                    with get_session() as session:
                        update_access(
                            session=session,
                            access_id=access_id,
                            is_active=True,
                            expires_at=new_expiry,
                            status="ready",
                            kubeconfig_encrypted=kubeconfig_encrypted,
                            revoked_at=None
                        )
                    logger.info(f"Token regenerated for {service_account_name}")
                    
                except Exception as e:
                    logger.error(f"Failed to regenerate token: {e}")
                    try:
                        from app.db_client.db import get_session
                        from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import update_access
                        with get_session() as session:
                            update_access(session=session, access_id=access_id, status="failed", error_message=str(e)[:500])
                    except:
                        pass
            
            background_tasks.add_task(
                regenerate_task,
                id,
                service_account_name,
                namespace,
                role_template
            )
            
            return JSONResponse(content={
                "id": id,
                "service_account": service_account_name,
                "namespace": namespace,
                "message": "Token regeneration initiated. Processing in background."
            })
        
        elif body.action == "change_role":
            if not body.role_template:
                return JSONResponse(status_code=400, content={"error": "role_template is required"})
            
            from app.k8s_helper.core.kubeconfig_generator import ROLE_TEMPLATES
            import json as _json
            
            # Resolve rules: custom takes from body, otherwise from template dict
            if body.role_template == "custom":
                if not body.custom_rules:
                    return JSONResponse(status_code=400, content={"error": "custom_rules is required when role_template is 'custom'"})
                rules = body.custom_rules
                _custom_rules_json = _json.dumps(rules)
            else:
                template = ROLE_TEMPLATES.get(body.role_template, ROLE_TEMPLATES["developer"])
                rules = template["rules"]
                _custom_rules_json = None
            
            role_name = f"{body.role_template}-template-{service_account_name}"
            
            def convert_rule_keys(rule):
                return {
                    "api_groups" if k == "apiGroups" else "non_resource_ur_ls" if k == "nonResourceURLs" else k: v
                    for k, v in rule.items()
                }
            
            try:
                from kubernetes import client
                rbac_api = client.RbacAuthorizationV1Api()
                role_body = client.V1Role(
                    metadata=client.V1ObjectMeta(name=role_name, namespace=namespace),
                    rules=[client.V1PolicyRule(**convert_rule_keys(r)) for r in rules]
                )
                rbac_api.replace_namespaced_role(name=role_name, namespace=namespace, body=role_body)
            except:
                try:
                    from kubernetes import client
                    rbac_api = client.RbacAuthorizationV1Api()
                    role_body = client.V1Role(
                        metadata=client.V1ObjectMeta(name=role_name, namespace=namespace),
                        rules=[client.V1PolicyRule(**convert_rule_keys(r)) for r in rules]
                    )
                    rbac_api.create_namespaced_role(namespace=namespace, body=role_body)
                except:
                    pass
            
            with get_session() as session:
                access = get_access(session, id)
                if access:
                    access.role_template = body.role_template
                    access.custom_rules = _custom_rules_json
                    session.add(access)
                    session.commit()
            
            return JSONResponse(content={
                "id": id,
                "service_account": service_account_name,
                "namespace": namespace,
                "role_template": body.role_template,
                "message": "Role updated successfully"
            })
        else:
            return JSONResponse(status_code=400, content={"error": f"Unknown action: {body.action}"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


async def DELETE(request: Request, id: int, action: str = "revoke", background_tasks: BackgroundTasks = None):
    try:
        from app.db_client.db import get_session
        from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import get_access
        
        with get_session() as session:
            access = get_access(session, id)
        
        if not access:
            return JSONResponse(status_code=404, content={"error": "User access not found"})
        
        service_account_name = access.service_account_name
        namespace = access.namespace
        access_id = id
        
        def revoke_task(access_id: int, service_account_name: str, namespace: str, role_template: str):
            from app.db_client.db import get_session
            from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import revoke_access, update_access
            from app.k8s_helper.core.kubeconfig_generator import KubeconfigGenerator
            import logging
            logger = logging.getLogger(__name__)
            
            try:
                generator = KubeconfigGenerator()
                generator.revoke_access(
                    service_account_name=service_account_name,
                    namespace=namespace,
                    role_template=role_template
                )
                with get_session() as session:
                    revoke_access(session, access_id)
                    update_access(session, access_id, kubeconfig_encrypted=None)
                logger.info(f"Access revoked for {service_account_name}")
            except Exception as e:
                logger.error(f"Failed to revoke access: {e}")
                try:
                    from app.db_client.db import get_session
                    from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import update_access
                    with get_session() as session:
                        update_access(session, access_id, status="failed", error_message=str(e)[:500])
                except:
                    pass
        
        def delete_task(access_id: int, service_account_name: str, namespace: str, role_template: str):
            from app.db_client.db import get_session
            from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import delete_access
            from app.k8s_helper.core.kubeconfig_generator import KubeconfigGenerator
            import logging
            logger = logging.getLogger(__name__)
            
            try:
                generator = KubeconfigGenerator()
                generator.delete_access(
                    service_account_name=service_account_name,
                    namespace=namespace,
                    role_template=role_template
                )
            except Exception as e:
                logger.warning(f"K8s cleanup failed (may not exist): {e}")
            
            try:
                with get_session() as session:
                    delete_access(session, access_id)
                logger.info(f"Access deleted from DB: {access_id}")
            except Exception as e:
                logger.error(f"Failed to delete access from DB: {e}")
                try:
                    from app.db_client.db import get_session
                    from app.db_client.controllers.kubeconfig_audit.kubeconfig_audit import update_access
                    with get_session() as session:
                        update_access(session, access_id, status="failed", error_message=str(e)[:500])
                except:
                    pass
        
        if action == "delete":
            background_tasks.add_task(delete_task, access_id, service_account_name, namespace, access.role_template)
            return JSONResponse(content={
                "id": access_id,
                "service_account": service_account_name,
                "namespace": namespace,
                "message": "Delete initiated. Processing in background."
            })
        
        background_tasks.add_task(revoke_task, access_id, service_account_name, namespace, access.role_template)
        return JSONResponse(content={
            "id": access_id,
            "service_account": service_account_name,
            "namespace": namespace,
            "message": "Revoke initiated. Processing in background."
        })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})