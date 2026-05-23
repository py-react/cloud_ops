import paramiko
import io
import json
from typing import Optional, Tuple
from app.db_client.models.ssh_management import SSHKey, System
from app.db_client.models.service_settings import ServiceSetting
from app.db_client.db import get_session
from sqlmodel import select
import logging

logger = logging.getLogger(__name__)

# DEBUG_START
def debug_log(id, message):
    import requests
    import json
    try:
        requests.post(f"http://localhost:8000/debug/{id}", data=json.dumps(message) if isinstance(message, dict) else str(message))
    except Exception:
        pass

DEBUG_ID = "bastion-key-deploy-2026-04-13"
# DEBUG_END


class BastionManager:
    """Helper for managing SSH keys and system connectivity"""

    @staticmethod
    def get_or_create_service_key():
        """
        Returns the global Bastion service (private_key_str, public_key_str, ssh_key_id).
        Generates and persists one if it doesn't exist yet.
        Also ensures an SSHKey record exists so the key appears in the Keys management page.
        """
        from app.db_client.models.ssh_management import SSHKey
        SERVICE_KEY_NAME = "Bastion Service Identity Key"

        with get_session() as db:
            priv_setting = db.exec(select(ServiceSetting).where(ServiceSetting.key == "service_private_key")).first()
            pub_setting = db.exec(select(ServiceSetting).where(ServiceSetting.key == "service_public_key")).first()

            if priv_setting and pub_setting:
                private_key = priv_setting.value
                public_key = pub_setting.value
            else:
                # Generate a new RSA keypair for this Bastion instance
                key = paramiko.RSAKey.generate(2048)
                priv_io = io.StringIO()
                key.write_private_key(priv_io)
                private_key = priv_io.getvalue()
                public_key = f"ssh-rsa {key.get_base64()} bastion-service"

                db.add(ServiceSetting(key="service_private_key", value=private_key))
                db.add(ServiceSetting(key="service_public_key", value=public_key))
                db.commit()
                logger.info("Generated new Bastion service identity key.")

            # Ensure an SSHKey record exists so it appears in the key management UI
            existing_ssh_key = db.exec(
                select(SSHKey).where(SSHKey.name == SERVICE_KEY_NAME)
            ).first()

            if not existing_ssh_key:
                existing_ssh_key = SSHKey(
                    name=SERVICE_KEY_NAME,
                    public_key=public_key,
                    user_id="bastion-service",
                    is_active=True,
                )
                db.add(existing_ssh_key)
                db.commit()
                db.refresh(existing_ssh_key)
                logger.info("Registered service identity key in SSH key management table.")

            return private_key, public_key, existing_ssh_key.id

    @staticmethod
    def rotate_service_key():
        """
        Generates a new global service key pair, updates ServiceSettings,
        and updates the registered SSHKey record.
        Existing systems will NOT be automatically updated; they will require
        re-provisioning or manual updates as this is a security fallback.
        """
        from app.db_client.models.ssh_management import SSHKey
        SERVICE_KEY_NAME = "Bastion Service Identity Key"

        with get_session() as db:
            # Generate new RSA keypair
            key = paramiko.RSAKey.generate(2048)
            priv_io = io.StringIO()
            key.write_private_key(priv_io)
            private_key = priv_io.getvalue()
            public_key = f"ssh-rsa {key.get_base64()} bastion-service"

            # Update ServiceSettings
            priv_setting = db.exec(select(ServiceSetting).where(ServiceSetting.key == "service_private_key")).first()
            pub_setting = db.exec(select(ServiceSetting).where(ServiceSetting.key == "service_public_key")).first()

            if not priv_setting:
                priv_setting = ServiceSetting(key="service_private_key")
            if not pub_setting:
                pub_setting = ServiceSetting(key="service_public_key")
            
            priv_setting.value = private_key
            pub_setting.value = public_key
            db.add(priv_setting)
            db.add(pub_setting)

            # Update registered SSHKey
            ssh_key = db.exec(select(SSHKey).where(SSHKey.name == SERVICE_KEY_NAME)).first()
            if ssh_key:
                ssh_key.public_key = public_key
                db.add(ssh_key)
            
            db.commit()
            logger.info("Rotated Bastion service identity key.")
            return private_key, public_key

    @staticmethod
    def reprovision_all_systems(old_private_key: str, new_public_key: str):
        """
        Attempt to deploy the new service key to all systems that were previously
        using the managed key. Uses parallel execution to avoid stalling.
        """
        from concurrent.futures import ThreadPoolExecutor
        from app.utils.crypto import decrypt
        
        with get_session() as db:
            statement = select(System).where(System.service_key_deployed == True).where(System.status != "deleted")
            systems = db.exec(statement).all()
            
            # Batch update all systems to 'reprovisioning' status
            for s in systems:
                s.status = "reprovisioning"
                db.add(s)
            db.commit()
            # Refresh systems list to have detached objects with the new status if needed, 
            # though we'll re-fetch or use IDs in tasks.
            system_ids = [s.id for s in systems]
            
        def _task(system_id):
            with get_session() as db:
                system = db.get(System, system_id)
                if not system: return
                
                logger.info(f"Attempting to re-provision {system.name} ({system.ip_address}) with new service key...")
                success = False
                
                # 1. Try using the OLD service key
                try:
                    BastionManager.deploy_public_key(
                        system_ip=system.ip_address,
                        public_key=new_public_key,
                        user=system.username or "root",
                        bootstrap_private_key=old_private_key
                    )
                    success = True
                    logger.info(f"Re-provisioned {system.name} using old service key.")
                except Exception as e:
                    logger.warning(f"Old key auth failed for {system.name}: {e}")

                # 2. If old key fails, try using the stored password
                if not success and system.password:
                    try:
                        password = decrypt(system.password)
                        BastionManager.deploy_public_key(
                            system_ip=system.ip_address,
                            public_key=new_public_key,
                            user=system.username or "root",
                            password=password
                        )
                        success = True
                        logger.info(f"Re-provisioned {system.name} using stored password.")
                    except Exception as e:
                        logger.error(f"Password re-provisioning failed for {system.name}: {e}")

                # Mark as active again (or handle failure)
                system.status = "active" if success else "inactive"
                db.add(system)
                db.commit()

                if not success:
                    logger.error(f"Critical: System {system.name} ({system.ip_address}) is now disconnected from Managed Bastion. Manual intervention required.")

        # Run sweep in parallel with up to 10 concurrent connections
        with ThreadPoolExecutor(max_workers=10) as executor:
            executor.map(_task, system_ids)


    @staticmethod
    def generate_key_pair() -> Tuple[str, str]:
        """Generate a new RSA key pair for a user/session"""
        key = paramiko.RSAKey.generate(2048)
        private_key_io = io.StringIO()
        key.write_private_key(private_key_io)
        private_key = private_key_io.getvalue()
        public_key = f"ssh-rsa {key.get_base64()}"
        return private_key, public_key

    @staticmethod
    def deploy_public_key(
        system_ip: str,
        public_key: str,
        user: str = "root",
        password: Optional[str] = None,
        bootstrap_private_key: Optional[str] = None,
    ):
        """
        Deploy a public key to a remote system's authorized_keys.
        Authenticates with password OR a bootstrap private key.
        """
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            connect_kwargs = {"hostname": system_ip, "username": user, "timeout": 10}
            if bootstrap_private_key:
                key_file = io.StringIO(bootstrap_private_key)
                pkey = paramiko.RSAKey.from_private_key(key_file)
                connect_kwargs["pkey"] = pkey
            elif password:
                connect_kwargs["password"] = password
            else:
                raise ValueError("Either password or bootstrap_private_key must be provided")

            client.connect(**connect_kwargs)

            cmd = (
                f'mkdir -p ~/.ssh && chmod 700 ~/.ssh && '
                f'touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && '
                f'grep -qF "{public_key}" ~/.ssh/authorized_keys || '
                f'echo "{public_key}" >> ~/.ssh/authorized_keys'
            )
            stdin, stdout, stderr = client.exec_command(cmd)
            exit_status = stdout.channel.recv_exit_status()
            if exit_status != 0:
                raise Exception(f"Key deployment failed: {stderr.read().decode()}")
        finally:
            client.close()

    @staticmethod
    def revoke_public_key(
        system_ip: str,
        public_key: str,
        user: str = "root",
        password: Optional[str] = None,
        bootstrap_private_key: Optional[str] = None,
    ):
        """Remove a public key from a remote system's authorized_keys"""
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            connect_kwargs = {"hostname": system_ip, "username": user, "timeout": 10}
            if bootstrap_private_key:
                key_file = io.StringIO(bootstrap_private_key)
                connect_kwargs["pkey"] = paramiko.RSAKey.from_private_key(key_file)
            elif password:
                connect_kwargs["password"] = password
            else:
                raise ValueError("Either password or bootstrap_private_key must be provided")

            client.connect(**connect_kwargs)

            # Use grep -vF to safely remove the exact line without delimiter issues
            # We match the exact public key string to avoid partial matches
            cmd = (
                f'grep -vF "{public_key}" ~/.ssh/authorized_keys > ~/.ssh/authorized_keys.tmp && '
                f'mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys && '
                f'chmod 600 ~/.ssh/authorized_keys'
            )
            stdin, stdout, stderr = client.exec_command(cmd)
            
            # Wait for command to complete and check status
            exit_status = stdout.channel.recv_exit_status()
            if exit_status != 0:
                error_msg = stderr.read().decode().strip()
                # If grep doesn't find the key, it exits with 1, which we can ignore 
                # but only if the error message is empty (no actual syntax/auth error)
                if exit_status == 1 and not error_msg:
                    pass
                else:
                    raise Exception(f"Revocation failed: {error_msg}")
        finally:
            client.close()

    @staticmethod
    async def handle_connection(websocket, system: System, audit_logger):
        """Bridge WebSocket to SSH channel or RDP session based on connection_type."""
        import asyncio
        from fastapi import WebSocketDisconnect
        
        if system.status == "reprovisioning":
            await websocket.send_text("\r\n\x1b[31m[BASTION ERROR] System is currently being re-provisioned after a service key rotation. Please try again in a few moments.\x1b[0m\r\n")
            await websocket.close()
            return

        if system.status != "active":
            status_label = system.status or 'inactive'
            await websocket.send_text(f"\r\n\x1b[31m[BASTION ERROR] System is currently {status_label}. Please activate it from the dashboard before connecting.\x1b[0m\r\n")
            await websocket.close()
            return

        if system.connection_type == "rdp":
            await BastionManager._handle_rdp_session(websocket, system, audit_logger)
        else:
            await BastionManager._handle_ssh_session_internal(websocket, system, audit_logger)

    @staticmethod
    async def _handle_rdp_session(websocket, system: System, audit_logger):
        """Handle RDP connection by sending connection details to the frontend."""
        try:
            from app.utils.crypto import decrypt as fernet_decrypt

            password = None
            if system.password:
                try:
                    password = fernet_decrypt(system.password)
                except Exception:
                    password = None

            rdp_config = {
                "type": "rdp_config",
                "system_id": system.id,
                "system_name": system.name,
                "ip_address": system.ip_address,
                "port": system.connection_port or 3389,
                "username": system.username or "Administrator",
                "password": password,
            }
            await websocket.send_text(json.dumps(rdp_config))
            await audit_logger.close()
            
            # Keep connection open for potential future signaling
            while True:
                try:
                    await websocket.receive_text()
                except WebSocketDisconnect:
                    break
        except Exception as e:
            logger.error(f"RDP session error for {system.name}: {e}")
            try:
                await websocket.send_text(json.dumps({"type": "error", "message": f"RDP session error: {e}"}))
            except Exception:
                pass
            await audit_logger.close()

    @staticmethod
    async def _handle_ssh_session_internal(websocket, system: System, audit_logger):
        """Bridge WebSocket to SSH channel using Paramiko. Prefers service key over password."""
        import asyncio
        from fastapi import WebSocketDisconnect
        
        # Import Fernet decrypt for password fallback
        try:
            from app.utils.crypto import decrypt as fernet_decrypt
        except Exception:
            fernet_decrypt = None

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        try:
            connect_user = system.username or "root"
            connected = False

            loop = asyncio.get_event_loop()
            last_error = "Unknown error"

            # 1. Try user-provided direct identity key if present (Cloud PEM use case)
            if system.private_key:
                try:
                    plain_key = fernet_decrypt(system.private_key) if fernet_decrypt else system.private_key
                    key_file = io.StringIO(plain_key)
                    pkey = paramiko.RSAKey.from_private_key(key_file)
                    await loop.run_in_executor(None, lambda: ssh.connect(system.ip_address, username=connect_user, pkey=pkey, timeout=10))
                    connected = True
                    logger.info(f"Connected to {system.ip_address} via user-provided private key")
                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"User private key auth failed for {system.ip_address}: {e}")

            # 2. Try service identity key if it was deployed (Bootstrap use case)
            if not connected and system.service_key_deployed:
                try:
                    private_key, _, _ = BastionManager.get_or_create_service_key()
                    key_file = io.StringIO(private_key)
                    pkey = paramiko.RSAKey.from_private_key(key_file)
                    await loop.run_in_executor(None, lambda: ssh.connect(system.ip_address, username=connect_user, pkey=pkey, timeout=10))
                    connected = True
                    logger.info(f"Connected to {system.ip_address} via service key")
                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"Service key auth failed for {system.ip_address}: {e}, falling back to password")

            # 3. Fall back to stored password (decrypting Fernet ciphertext if present)
            if not connected and system.password:
                try:
                    plain_password = fernet_decrypt(system.password) if fernet_decrypt else system.password
                except Exception:
                    plain_password = system.password  # Legacy plaintext
                
                try:
                    await loop.run_in_executor(None, lambda: ssh.connect(system.ip_address, username=connect_user, password=plain_password, timeout=10))
                    connected = True
                    logger.info(f"Connected to {system.ip_address} via password")
                except Exception as e:
                    last_error = str(e)
                    logger.warning(f"Password auth failed for {system.ip_address}: {e}")

            if not connected:
                error_msg = f"\r\n\x1b[31mFailed to connect to {system.ip_address}: {last_error}\x1b[0m\r\n"
                await websocket.send_text(error_msg)
                return

            channel = ssh.invoke_shell(term="xterm", width=80, height=24)
            channel.setblocking(0)

            async def listen_to_ssh():
                while True:
                    try:
                        if channel.recv_ready():
                            data = channel.recv(4096).decode("utf-8", errors="ignore")
                            await audit_logger.log_output(data)
                            await websocket.send_text(data)
                        await asyncio.sleep(0.01)
                    except Exception:
                        break

            async def listen_to_websocket():
                try:
                    while True:
                        data = await websocket.receive_text()
                        if data.startswith('{"type":"resize"'):
                            import json
                            try:
                                msg = json.loads(data)
                                channel.resize_pty(width=msg.get("cols", 80), height=msg.get("rows", 24))
                            except Exception:
                                pass
                            continue
                        channel.send(data)
                except WebSocketDisconnect:
                    pass

            ssh_task = asyncio.create_task(listen_to_ssh())
            ws_task = asyncio.create_task(listen_to_websocket())
            
            # Wait until either the SSH connection drops or the WebSocket closes
            await asyncio.wait([ssh_task, ws_task], return_when=asyncio.FIRST_COMPLETED)
            
            # Cancel the remaining task
            ssh_task.cancel()
            ws_task.cancel()

        finally:
            await audit_logger.close()
            ssh.close()

    @staticmethod
    async def handle_ssh_session(websocket, system: System, audit_logger):
        """Legacy wrapper — delegates to handle_connection for protocol routing."""
        await BastionManager.handle_connection(websocket, system, audit_logger)



    @staticmethod
    def _get_ssh_client(system_data: dict):
        """Helper to create and connect SSH client based on prioritized auth methods"""
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        connect_kwargs = {
            "hostname": system_data["ip_address"],
            "username": system_data["username"] or "root",
            "timeout": 15
        }

        # Auth Priority: System PEM -> Service Identity Key -> Password
        if system_data.get("private_key"):
            # DEBUG_START
            debug_log(DEBUG_ID, "Using system-provided private key (.pem)")
            # DEBUG_END
            connect_kwargs["pkey"] = paramiko.RSAKey.from_private_key(io.StringIO(system_data["private_key"]))
        elif system_data.get("service_key_deployed"):
            # DEBUG_START
            debug_log(DEBUG_ID, "Using Bastion service identity key")
            # DEBUG_END
            private_key, _, _ = BastionManager.get_or_create_service_key()
            connect_kwargs["pkey"] = paramiko.RSAKey.from_private_key(io.StringIO(private_key))
        elif system_data.get("password"):
            # DEBUG_START
            debug_log(DEBUG_ID, "Using system password")
            # DEBUG_END
            connect_kwargs["password"] = system_data["password"]
        
        client.connect(**connect_kwargs)
        return client

    @staticmethod
    def _exec_sudo(client, command, password=None):
        """Execute a command as sudo, handling password piping if needed"""
        if password:
            # Use sudo -S to read password from stdin
            # We use a unique marker to detect password prompt if needed, 
            # but usually piping directly works.
            cmd = f"sudo -S -p '' {command}"
            stdin, stdout, stderr = client.exec_command(cmd)
            stdin.write(password + '\n')
            stdin.flush()
        else:
            # Try without password piping (maybe passwordless sudo or root)
            stdin, stdout, stderr = client.exec_command(f"sudo {command}")
            
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            error_msg = stderr.read().decode().strip()
            raise Exception(f"Sudo command failed (code {exit_status}): {error_msg}")
        return stdout.read().decode()

    @staticmethod
    def background_deploy_task(deployment_id: int):
        """
        Background worker to provision user and deploy keys.
        """
        # DEBUG_START
        debug_log(DEBUG_ID, f"Starting background_deploy_task for ID: {deployment_id}")
        # DEBUG_END

        from app.db_client.models.ssh_management import KeyDeployment, SSHKey, System
        from app.utils.crypto import decrypt
        from datetime import datetime
        
        # 1. Fetch and Extract all data into a standard DICT to avoid DetachedInstanceError
        system_data = {}
        deployment_data = {}
        public_key = ""

        with get_session() as db:
            deployment = db.get(KeyDeployment, deployment_id)
            if not deployment: return
            
            key = db.get(SSHKey, deployment.key_id)
            system = db.get(System, deployment.system_id)
            
            if not key or not system:
                deployment.status = "failed"
                deployment.last_error = "Key or System missing"
                db.add(deployment)
                db.commit()
                return

            public_key = key.public_key
            deployment_data = {
                "id": deployment.id,
                "linux_username": deployment.linux_username,
                "privilege_level": deployment.privilege_level,
                "is_system_managed": deployment.is_system_managed,
                "restrictions": deployment.restrictions or {}
            }
            system_data = {
                "ip_address": system.ip_address,
                "username": system.username,
                "password": decrypt(system.password) if system.password else None,
                "private_key": decrypt(system.private_key) if system.private_key else None,
                "service_key_deployed": system.service_key_deployed,
                "os_type": system.os_type
            }

        try:
            # 2. Connection and Execution
            client = BastionManager._get_ssh_client(system_data)
            try:
                # Part A: Provision User
                if deployment_data["is_system_managed"]:
                    # DEBUG_START
                    debug_log(DEBUG_ID, f"Step 1: Provisioning user {deployment_data['linux_username']}")
                    # DEBUG_END
                    shell = "/bin/bash"
                    BastionManager._exec_sudo(client, f"useradd -m -s {shell} {deployment_data['linux_username']} || true", system_data["password"])
                    
                    if deployment_data["privilege_level"] in ["sudo", "admin"]:
                        group = "sudo" if system_data["os_type"] == "linux" else "wheel"
                        BastionManager._exec_sudo(client, f"usermod -aG {group} {deployment_data['linux_username']}", system_data["password"])

                # Part B: Deploy Key
                # DEBUG_START
                debug_log(DEBUG_ID, "Step 2: Deploying key with restrictions")
                # DEBUG_END
                restrictions = deployment_data["restrictions"]
                prefix_parts = []
                if restrictions.get("no_port_forwarding"): prefix_parts.append("no-port-forwarding")
                if restrictions.get("no_agent_forwarding"): prefix_parts.append("no-agent-forwarding")
                if restrictions.get("no_x11_forwarding"): prefix_parts.append("no-x11-forwarding")
                
                prefix = ",".join(prefix_parts) + " " if prefix_parts else ""
                full_key_line = f"{prefix}{public_key}"

                if restrictions.get("restricted_shell"):
                     BastionManager._exec_sudo(client, f"usermod -s /bin/rbash {deployment_data['linux_username']}", system_data["password"])

                linux_user = deployment_data["linux_username"]
                target_home = f"/home/{linux_user}" if linux_user != "root" else "/root"

                cmd = (
                    f"bash -c 'mkdir -p {target_home}/.ssh && chmod 700 {target_home}/.ssh && "
                    f"touch {target_home}/.ssh/authorized_keys && chmod 600 {target_home}/.ssh/authorized_keys && "
                    f"grep -qF \"{public_key}\" {target_home}/.ssh/authorized_keys || "
                    f"echo \"{full_key_line}\" >> {target_home}/.ssh/authorized_keys && "
                    f"chown -R {linux_user}:{linux_user} {target_home}/.ssh'"
                )
                BastionManager._exec_sudo(client, cmd, system_data["password"])

                # Update Status
                with get_session() as db:
                    deployment = db.get(KeyDeployment, deployment_id)
                    deployment.status = "active"
                    deployment.updated_at = datetime.utcnow()
                    db.add(deployment)
                    db.commit()
                
                # DEBUG_START
                debug_log(DEBUG_ID, f"Deployment {deployment_id} SUCCESS")
                # DEBUG_END

            finally:
                client.close()
                
        except Exception as e:
            logger.error(f"Background deploy failed for {deployment_id}: {e}")
            # DEBUG_START
            debug_log(DEBUG_ID, f"ERROR in background_deploy_task: {str(e)}")
            # DEBUG_END
            with get_session() as db:
                deployment = db.get(KeyDeployment, deployment_id)
                deployment.status = "failed"
                deployment.last_error = str(e)
                deployment.updated_at = datetime.utcnow()
                db.add(deployment)
                db.commit()

    @staticmethod
    def background_revoke_task(deployment_id: int):
        """
        Background worker to remove access/user.
        """
        from app.db_client.models.ssh_management import KeyDeployment, System
        from app.utils.crypto import decrypt
        from datetime import datetime
        
        system_data = {}
        deployment_data = {}

        with get_session() as db:
            deployment = db.get(KeyDeployment, deployment_id)
            if not deployment: return
            system = db.get(System, deployment.system_id)
            if not system:
                db.delete(deployment)
                db.commit()
                return
            
            deployment_data = {
                "linux_username": deployment.linux_username,
                "is_system_managed": deployment.is_system_managed
            }
            system_data = {
                "ip_address": system.ip_address,
                "username": system.username,
                "password": decrypt(system.password) if system.password else None,
                "private_key": decrypt(system.private_key) if system.private_key else None,
                "service_key_deployed": system.service_key_deployed
            }

        try:
            client = BastionManager._get_ssh_client(system_data)
            try:
                if deployment_data["is_system_managed"] and deployment_data["linux_username"] != "root":
                    BastionManager._exec_sudo(client, f"userdel -r {deployment_data['linux_username']}", system_data["password"])
                else:
                    target_home = f"/home/{deployment_data['linux_username']}" if deployment_data["linux_username"] != "root" else "/root"
                    BastionManager._exec_sudo(client, f"rm -f {target_home}/.ssh/authorized_keys", system_data["password"])
                
                with get_session() as db:
                    deployment = db.get(KeyDeployment, deployment_id)
                    db.delete(deployment)
                    db.commit()
            finally:
                client.close()
                
        except Exception as e:
            logger.error(f"Background revoke failed for {deployment_id}: {e}")
            with get_session() as db:
                deployment = db.get(KeyDeployment, deployment_id)
                deployment.status = "revoke_failed"
                deployment.last_error = str(e)
                deployment.updated_at = datetime.utcnow()
                db.add(deployment)
                db.commit()

    @staticmethod
    def provision_system_user(system: System, linux_username: str, privilege_level: str = "user"):
        # Deprecated in favor of dictionary-based background tasks, but keeping for compatibility if needed
        pass

    @staticmethod
    def deploy_key_with_restrictions(system: System, linux_username: str, public_key: str, restrictions: dict):
        # Deprecated in favor of dictionary-based background tasks, but keeping for compatibility if needed
        pass

    @staticmethod
    def deprovision_system_user(system: System, linux_username: str, is_system_managed: bool):
        # Deprecated in favor of dictionary-based background tasks, but keeping for compatibility if needed
        pass


