import logging
import asyncio
from typing import Optional, List, Dict, Any
import docker
from sqlmodel import Session, select
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from app.db_client.models.deployment_run.deployment_run import DeploymentRun
from app.db_client.controllers.github_pat.github_pat import get_credential
from app.docker_client.registry import RegistryManager
from app.github_client.config.registry_config import load_registries, RegistryConfig
from app.utils.get_fernet import get_fernet
from datetime import datetime

logger = logging.getLogger(__name__)


class PackageReleaseService:
    """Service for orchestrating library package releases using Docker containers."""

    def __init__(self, session: Session):
        self.session = session
        from render_relay.utils import load_settings
        self.settings = load_settings()
        self.registries = load_registries(self.settings)
        self.registry_manager = RegistryManager(self.registries)

    def _get_registry_for_image(self, image_name: str) -> RegistryConfig:
        """Find the matching registry configuration for a given image name."""
        for reg in self.registries:
            if image_name.startswith(reg.url):
                return reg
        
        # Fallback to primary registry if no match
        return self.registry_manager.get_primary_registry()

    async def release_package(self, config_obj: DeploymentConfig, run_obj: DeploymentRun):
        """
        Pull the PR-built Docker image and run the publication command inside it.
        """
        import sys
        try:
            image_name = run_obj.images.get("main", "unknown") if isinstance(run_obj.images, dict) else "unknown"
            
            sys.stderr.write(f"--- STARTING PACKAGE RELEASE FLOW ---\n")
            sys.stderr.write(f"Target: {config_obj.package_type} (Source of Truth: {'package.json' if config_obj.package_type == 'npm' else 'pyproject.toml'})\n")

            # 2. Resolve image and pull it
            if image_name == "unknown":
                raise Exception("No image tag provided for package release. Please ensure a PR image was selected.")

            registry_config = self._get_registry_for_image(image_name)
            
            sys.stderr.write(f"Pulling image {image_name} from {registry_config.url}...\n")
                
            try:
                pull_logs = await self.registry_manager.pull_image(image_name, registry_config)
                sys.stderr.write("".join([l + '\n' for l in (pull_logs[-5:] if len(pull_logs) > 5 else pull_logs)]))
                sys.stderr.write("DEBUG: Pull Image succeeded.\n")
            except Exception as e:
                sys.stderr.write(f"DEBUG: _pull_image failed: {e}\n")
                raise
            
            # 3. Initialize Decryption
            f = get_fernet()
            if not f:
                 logger.warning("Encryption key not configured. Attempting plaintext fallback for credentials.")
            
            # 4. Get Registry Credentials
            package_type = config_obj.package_type.lower() if config_obj.package_type else "npm"
            
            # Use only the linked credential from Release Config - no fallback
            if not config_obj.registry_credential_id:
                raise Exception(f"No publish credential configured in Release Config. Please link a credential in Release Config settings.")
            
            registry_cred = get_credential(self.session, config_obj.registry_credential_id)
            
            if not registry_cred:
                raise Exception(f"Configured credential not found. Please select a valid credential in Release Config.")
            
            registry_token = registry_cred.token_encrypted
            if f:
                try:
                    registry_token = f.decrypt(registry_token.encode('utf-8')).decode('utf-8')
                except Exception as e:
                    logger.error(f"Failed to decrypt {package_type} token: {e}")
                    raise Exception(f"Failed to decrypt {package_type} token. Please check your encryption configuration.")

            # 5. Run Publication
            sys.stderr.write(f"Executing publication command inside container...\n")
            
            if package_type == "npm":
                publish_cmd = f"echo '//registry.npmjs.org/:_authToken={registry_token}' >> .npmrc && npm publish"
                if not run_obj.is_public:
                    publish_cmd += " --access restricted"
                else:
                    publish_cmd += " --access public"
            elif package_type == "pypi":
                # Create .pypirc file with token, then upload via twine
                publish_cmd = """set -x; cat > ~/.pypirc << 'EOF'\n[distutils]\nindex-servers = pypi\n\n[pypi]\nusername = __token__\npassword = TOKEN_PLACEHOLDER\nEOF\nset -e; python3 -m twine upload ./dist/*""".replace("TOKEN_PLACEHOLDER", registry_token)
            else:
                raise Exception(f"Unsupported package type for container-based release: {package_type}")

            docker_client = self.registry_manager.docker_client
            
            def _run_container():
                logs_stream = docker_client.containers.run(
                    image_name,
                    command=f"sh -c '{publish_cmd}'",
                    remove=True,
                    stream=True,
                    stderr=True,
                    stdout=True
                )
                return logs_stream

            # Stream logs in real-time
            container_logs_generator = await asyncio.to_thread(_run_container)
            
            for line in container_logs_generator:
                if isinstance(line, bytes):
                    decoded_line = line.decode('utf-8', errors='replace')
                elif isinstance(line, str):
                    decoded_line = line
                else:
                    decoded_line = str(line)
                sys.stderr.write(decoded_line)

            # 6. Cleanup - Remove the pulled image after successful publication
            try:
                sys.stderr.write(f"Cleaning up image {image_name}...\n")
                self.registry_manager.docker_client.images.remove(image_name, force=True)
                sys.stderr.write("DEBUG: Image cleanup completed.\n")
            except Exception as cleanup_err:
                sys.stderr.write(f"WARNING: Failed to cleanup image: {cleanup_err}\n")

            # 6. Finalize
            sys.stderr.write(f"\n--- PACKAGE RELEASE SUCCESSFUL ---\n")

        except Exception as e:
            logger.error(f"Package release failed: {e}")
            sys.stderr.write(f"\nERROR: {str(e)}\n")
            raise Exception(f"Library release failed: {str(e)}")
