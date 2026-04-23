import os
import base64
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from kubernetes import client
from kubernetes.client import ApiException
import yaml

logger = logging.getLogger(__name__)


class ServiceAccountOperations:
    def __init__(self, api_client: client.ApiClient = None):
        self.api_client = api_client or client.ApiClient()
        self.core_v1_api = client.CoreV1Api(self.api_client)

    def create_service_account(
        self,
        name: str,
        namespace: str,
        description: str = ""
    ) -> Dict[str, Any]:
        """Create a ServiceAccount in the specified namespace"""
        logger.info(f"Creating SA: {name} in namespace: {namespace}")
        
        metadata = client.V1ObjectMeta(
            name=name,
            namespace=namespace,
            annotations={"description": description} if description else {}
        )
        sa = client.V1ServiceAccount(metadata=metadata)
        
        try:
            result = self.core_v1_api.create_namespaced_service_account(
                namespace=namespace,
                body=sa
            )
            logger.info(f"SA created successfully: {result.metadata.name}")
            return {
                "status": "created",
                "name": result.metadata.name,
                "namespace": result.metadata.namespace,
                "created_at": str(result.metadata.creation_timestamp)
            }
        except ApiException as e:
            if e.status == 409:
                logger.warning(f"SA already exists: {name}, fetching existing SA.")
                try:
                    existing_sa = self.core_v1_api.read_namespaced_service_account(name=name, namespace=namespace)
                    return {
                        "status": "created",  # Treat as created to maintain idempotency
                        "name": existing_sa.metadata.name,
                        "namespace": existing_sa.metadata.namespace,
                        "created_at": str(existing_sa.metadata.creation_timestamp)
                    }
                except ApiException:
                    pass
                raise Exception(f"ServiceAccount '{name}' already exists in namespace '{namespace}'")
            logger.error(f"Failed to create SA: {e.body}")
            raise Exception(f"Failed to create ServiceAccount: {e.body}")
    
    def get_service_account(
        self,
        name: str,
        namespace: str
    ) -> Optional[Dict[str, Any]]:
        """Get ServiceAccount details"""
        try:
            sa = self.core_v1_api.read_namespaced_service_account(
                name=name,
                namespace=namespace
            )
            return {
                "name": sa.metadata.name,
                "namespace": sa.metadata.namespace,
                "description": sa.metadata.annotations.get("description", ""),
                "created_at": str(sa.metadata.creation_timestamp),
                "secrets": [{"name": s.name} for s in (sa.secrets or [])],
                "image_pull_secrets": [{"name": s.name} for s in (sa.image_pull_secrets or [])]
            }
        except ApiException as e:
            if e.status == 404:
                return None
            raise Exception(f"Failed to get ServiceAccount: {e.body}")
    
    def list_service_accounts(
        self,
        namespace: str
    ) -> List[Dict[str, Any]]:
        """List all ServiceAccounts in namespace"""
        try:
            sa_list = self.core_v1_api.list_namespaced_service_account(
                namespace=namespace
            )
            return [
                {
                    "name": sa.metadata.name,
                    "namespace": sa.metadata.namespace,
                    "description": sa.metadata.annotations.get("description", ""),
                    "created_at": str(sa.metadata.creation_timestamp),
                    "age": self._calculate_age(sa.metadata.creation_timestamp)
                }
                for sa in sa_list.items
            ]
        except ApiException as e:
            raise Exception(f"Failed to list ServiceAccounts: {e.body}")
    
    def delete_service_account(
        self,
        name: str,
        namespace: str
    ) -> Dict[str, Any]:
        """Delete a ServiceAccount (also deletes associated secret/token)"""
        try:
            self.core_v1_api.delete_namespaced_service_account(
                name=name,
                namespace=namespace,
                body=client.V1DeleteOptions()
            )
            return {
                "status": "deleted",
                "name": name,
                "namespace": namespace
            }
        except ApiException as e:
            if e.status == 404:
                raise Exception(f"ServiceAccount '{name}' not found in namespace '{namespace}'")
            raise Exception(f"Failed to delete ServiceAccount: {e.body}")
    
    
    
    def create_token_request(
        self,
        name: str,
        namespace: str,
        expiry_hours: int = 168
    ) -> str:
        """Create a token using the TokenRequest API (K8s 1.24+)"""
        try:
            logger.info(f"Creating TokenRequest for SA: {name} in namespace: {namespace} with expiry {expiry_hours}h")
            
            expiration_seconds = int(expiry_hours * 3600)
            
            # Setup TokenRequest bypassing python client validation for `audiences`
            token_request_body = {
                "spec": {
                    "expirationSeconds": expiration_seconds
                }
            }
            
            response = self.core_v1_api.create_namespaced_service_account_token(
                name=name,
                namespace=namespace,
                body=token_request_body
            )
            
            if hasattr(response, 'status') and hasattr(response.status, 'token'):
                logger.info("Token obtained successfully via TokenRequest API")
                return response.status.token
            
            raise Exception("TokenRequest response missing token")
        except Exception as e:
            logger.error(f"Token creation failed: {str(e)}")
            raise Exception(f"Failed to create token: {str(e)}")
    
    
    
    def _calculate_age(self, timestamp) -> str:
        """Calculate age from timestamp"""
        if not timestamp:
            return "Unknown"
        
        now = datetime.now(timestamp.tzinfo)
        delta = now - timestamp
        
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