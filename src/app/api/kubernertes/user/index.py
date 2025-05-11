from app.k8s_helper.core.user_ops import UserOperations
from typing import Optional
from kubernetes import client
from kubernetes.client import Configuration
from app.k8s_helper.models.rbac import KubeconfigUser ,RBACRoleSpec ,RBACBindingSpec

import os
import base64
import tempfile

def get_api_client(api_server_url: str, cert_path: str=None, key_path: str=None, ca_cert_path: str = None,verify_ssl=None,token=None):
    configuration = Configuration()
    print(api_server_url,cert_path,key_path,ca_cert_path,token)
    configuration.host = api_server_url
    if not token:
        configuration.cert_file = cert_path
        configuration.key_file = key_path

    configuration.verify_ssl = bool(ca_cert_path)
    if ca_cert_path:
        configuration.ssl_ca_cert = ca_cert_path
        
    api_client = client.ApiClient(configuration)
    if token:
        auth_header = f"Bearer {token}"
        api_client.set_default_header('Authorization', auth_header)
    return api_client


async def GET(namespace:Optional[str]=None):
    users_ops = UserOperations()
    users = []
    temp_files = []
    all_users = users_ops.list_users()
    for user in all_users:
        api_server = user.get("cluster").get("cluster").get("server")
        if user.get("user").get("user").get("token"):
            api_client = get_api_client(api_server, token=user.get("user").get("user").get("token"))
        else:
            if user.get("user").get("user").get('client-certificate-data'):
                cert_temp = tempfile.NamedTemporaryFile(delete=False)
                cert_temp.write(base64.b64decode(user.get("user").get("user").get('client-certificate-data')))
                temp_files.append(cert_temp.name)
                cert_path= cert_temp.name
                cert_temp.close()

            if user.get("user").get("user").get('client-key-data'):
                key_temp = tempfile.NamedTemporaryFile(delete=False)
                key_temp.write(base64.b64decode(user.get("user").get("user").get('client-key-data')))
                temp_files.append(key_temp.name)
                key_path=key_temp.name
                key_temp.close()
                
            if user.get("cluster").get("cluster").get('certificate-authority-data'):
                ca_temp = tempfile.NamedTemporaryFile(delete=False)
                ca_temp.write(base64.b64decode(user.get("cluster").get("cluster").get('certificate-authority-data')))
                temp_files.append(ca_temp.name)
                ca_cert_path = ca_temp.name
                ca_temp.close()

            insecure_skip_tls_verify = user.get("cluster").get("cluster").get("insecure-skip-tls-verify",False)
            
            api_client = get_api_client(api_server, cert_path, key_path, ca_cert_path, verify_ssl=insecure_skip_tls_verify)

        remote_user_ops = UserOperations(api_client=api_client)
        
        try:
            roles = remote_user_ops.list_roles()
        except client.ApiException as e:
            roles = []
        except Exception as e:
            roles = []
        try:
            role_bindings = remote_user_ops.list_bindings()
        except client.ApiException as e:
            role_bindings = []
        except Exception as e:
            role_bindings = []
        
        user_data={
            "user" : user["user"]["name"],
            "cluster": user["cluster"]["name"],
            "context": user["context"]["name"],
            "roles": roles,
            "role_bindings":role_bindings
        }
        users.append(user_data)

    # Clean up temporary files
        for temp_file in temp_files:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except:
                    pass
    return users
