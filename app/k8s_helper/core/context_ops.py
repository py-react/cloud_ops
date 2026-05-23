import os
from kubernetes import config,client
from kubernetes.client import Configuration
from pydantic import BaseModel
from typing import Optional,Tuple
from ..models import CreateContextUserData, CreateContextClusterData, CreateContextData
import tempfile
import base64
import yaml

from app.services.kube_config_service import KubeConfigService
from sqlmodel import Session
from app.db_client.db import engine
from app.db_client.models.kubernetes_configs.kube_config_file import KubeConfigFile
from datetime import datetime

class ContextOperations:
    """Class containing Context-related operations"""
    def __init__(self, path: Optional[str] = None):
        self.db_config_id = None
        self.config_file = None
        
        if path:
            self.config_file = os.path.expanduser(path)
        else:
            with Session(engine) as session:
                active = KubeConfigService.get_active_config(session)
                if active:
                    if active.is_system_config:
                        self.config_file = os.path.expanduser(active.system_path)
                    else:
                        self.db_config_id = active.id
                else:
                    # No active config and no path provided - do not fall back
                    self.config_file = None

    def test_connection(self, configuration: Configuration, auth_header: Optional[str] = None) -> bool:
        """Test if we can connect to the cluster with given configuration"""
        try:
            api_client = client.ApiClient(configuration)
            if auth_header:
                api_client.set_default_header('Authorization', auth_header)
            v1 = client.CoreV1Api(api_client)
            # Just try to get API versions which requires minimal permissions
            v1.get_api_resources()
            return True
        except Exception as e:
            raise Exception(f"Failed to connect to cluster: {str(e)}")
    
    def load_kubeconfig(self) -> Tuple[dict, dict]:
        """Load the kubeconfig file"""
        if self.db_config_id:
            with Session(engine) as session:
                kube_file = session.get(KubeConfigFile, self.db_config_id)
                if not kube_file:
                    raise ValueError("Active Kubeconfig not found in DB")
                content = KubeConfigService.decrypt_content(kube_file.content_encrypted)
                config_dict = yaml.safe_load(content) or {}
        else:
            if not self.config_file:
                raise ValueError("No active Kubernetes configuration selected. Please upload or activate a Kubeconfig in the Control Center.")
            
            if not os.path.exists(self.config_file):
                config_dict = {}
            else:
                with open(self.config_file, 'r') as f:
                    config_dict = yaml.safe_load(f) or {}
            
        if not isinstance(config_dict, dict):
            config_dict = {}

        # Ensure the basic structure exists
        config_dict.setdefault('apiVersion', 'v1')
        config_dict.setdefault('kind', 'Config')
        config_dict.setdefault('current-context', '')
        config_dict.setdefault('preferences', {})
        config_dict.setdefault('clusters', [])
        config_dict.setdefault('contexts', [])
        config_dict.setdefault('users', [])
        return config_dict, config_dict
    
    def save_kubeconfig(self, config_dict: dict):
        """Save the kubeconfig file"""
        if self.db_config_id:
            with Session(engine) as session:
                kube_file = session.get(KubeConfigFile, self.db_config_id)
                if kube_file:
                    content = yaml.dump(config_dict, default_flow_style=False)
                    kube_file.content_encrypted = KubeConfigService.encrypt_content(content)
                    kube_file.updated_at = datetime.utcnow()
                    session.add(kube_file)
                    session.commit()
                    # Reload global config if it's the active one
                    if kube_file.is_active:
                        KubeConfigService.load_active_config()
        else:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            # Save with proper yaml formatting
            with open(self.config_file, 'w') as f:
                yaml.safe_dump(config_dict, f, default_flow_style=False)

    def get_current_contex(self):
        try:
            _, active_context = config.list_kube_config_contexts(self.config_file)
            return active_context["name"]
        except config.config_exception.ConfigException as e:
            raise "No Kubeconfig or contexts found"
        except Exception as e:
            raise Exception(f"{str(e)}")

    def get_contexts(self):
        try:
            contexts, active_context = config.list_kube_config_contexts(self.config_file)
            return {
                "current_context":active_context["name"],
                "contexts":contexts
            }
        except config.config_exception.ConfigException as e:
            raise "No Kubeconfig or contexts found"
        except Exception as e:
            raise Exception(f"{str(e)}")
        
    def create_context(self,data:CreateContextData):
        """
        Create a new kubernetes context
        
        Expected payload:
        {
            "name": "context-name",
            "cluster": {
                "server": "https://kubernetes.example.com",
                "certificate_authority_data": "base64-encoded-ca-cert",  # Optional
                "insecure_skip_tls_verify": false  # Optional
            },
            "user": {
                "token": "bearer-token",  # Optional
                "client_certificate_data": "base64-encoded-cert",  # Optional
                "client_key_data": "base64-encoded-key",  # Optional
                "username": "username",  # Optional
                "password": "password"  # Optional
            },
            "namespace": "default",  # Optional
            "set_current": false  # Optional
        }
        """
        try:
            payload = data.model_dump()
            
            # Validate required fields
            if not payload.get('name'):
                raise Exception("Context name is required")
            if not payload.get('cluster') or not payload['cluster'].get('server'):
                raise Exception("Cluster server URL is required")
                
            # Create new configuration for testing
            test_config = Configuration()
            test_config.host = payload['cluster']['server']
            test_config.verify_ssl = not payload['cluster'].get('insecure_skip_tls_verify', False)
            
            # Set up cluster configuration
            cluster_config = {
                'server': payload['cluster']['server']
            }
            
            temp_files = []  # Track temporary files for cleanup
            if payload['cluster'].get('certificate_authority_data'):
                cluster_config['certificate-authority-data'] = payload['cluster']['certificate_authority_data']
                # Create temporary file for CA cert for testing
                ca_temp = tempfile.NamedTemporaryFile(delete=False)
                ca_temp.write(base64.b64decode(payload['cluster']['certificate_authority_data']))
                ca_temp.close()
                test_config.ssl_ca_cert = ca_temp.name
                temp_files.append(ca_temp.name)
                
            if payload['cluster'].get('insecure_skip_tls_verify'):
                test_config.verify_ssl = False
                cluster_config['insecure-skip-tls-verify'] = True
                
            # Set up user configuration and auth header
            user_config = {}
            auth_header = None
            
            if payload.get('user'):
                if payload['user'].get('token'):
                    auth_header = f"Bearer {payload['user']['token']}"
                    user_config['token'] = payload['user']['token']
                    
                if payload['user'].get('client_certificate_data') or payload['user'].get('client_key_data'):
                    # Both cert and key are required if either is provided
                    if not (payload['user'].get('client_certificate_data') and payload['user'].get('client_key_data')):
                        raise Exception("Both client certificate and key are required when using certificate authentication")
                    
                    # Create temporary files for client cert and key for testing
                    cert_temp = tempfile.NamedTemporaryFile(delete=False)
                    cert_temp.write(base64.b64decode(payload['user']['client_certificate_data']))
                    cert_temp.close()
                    test_config.cert_file = cert_temp.name
                    temp_files.append(cert_temp.name)
                    
                    key_temp = tempfile.NamedTemporaryFile(delete=False)
                    key_temp.write(base64.b64decode(payload['user']['client_key_data']))
                    key_temp.close()
                    test_config.key_file = key_temp.name
                    temp_files.append(key_temp.name)
                    
                    user_config['client-certificate-data'] = payload['user']['client_certificate_data']
                    user_config['client-key-data'] = payload['user']['client_key_data']
                    
                elif payload['user'].get('username') and payload['user'].get('password'):
                    test_config.username = payload['user']['username']
                    test_config.password = payload['user']['password']
                    user_config['username'] = payload['user']['username']
                    user_config['password'] = payload['user']['password']
                
                # If no valid auth method is provided
                if not user_config:
                    raise Exception("No valid authentication method provided. Please provide either a token, client certificate/key pair, or username/password")
            
            # Test the connection
            try:
                self.test_connection(test_config, auth_header)
            finally:
                # Clean up temporary files
                for temp_file in temp_files:
                    if temp_file and os.path.exists(temp_file):
                        try:
                            os.unlink(temp_file)
                        except:
                            pass
            
            # Load existing kubeconfig
            config_dict,raw_dict = self.load_kubeconfig()
            
            # Update clusters
            cluster_entry = {
                'name': payload['name'],
                'cluster': cluster_config
            }
            config_dict['clusters'] = [c for c in config_dict['clusters'] if c['name'] != payload['name']]
            config_dict['clusters'].append(cluster_entry)
            
            # Update users
            if user_config:
                user_entry = {
                    'name': payload['name'],
                    'user': user_config
                }
                config_dict['users'] = [u for u in config_dict['users'] if u['name'] != payload['name']]
                config_dict['users'].append(user_entry)
            
            # Update contexts
            context_entry = {
                'name': payload['name'],
                'context': {
                    'cluster': payload['name'],
                    'user': payload['name'],
                    'namespace': payload.get('namespace', 'default')
                }
            }
            config_dict['contexts'] = [c for c in config_dict['contexts'] if c['name'] != payload['name']]
            config_dict['contexts'].append(context_entry)
            
            # Set as current if requested
            if payload.get('set_current'):
                config_dict['current-context'] = payload['name']
            
            
            # Save the updated config
            self.save_kubeconfig(config_dict)
            
            return {
                "name": payload['name'],
                "server": payload['cluster']['server'],
                "namespace": payload.get('namespace', 'default'),
                "is_current": payload.get('set_current', False)
            }
            
        except Exception as e:
            raise Exception(f"{str(e)}")

            


