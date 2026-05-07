import subprocess
import logging
from typing import List, Optional, Dict
import os

logger = logging.getLogger(__name__)

class HelmManager:
    @staticmethod
    def _run_helm_command(args: List[str]):
        try:
            # We use check=True to raise an exception on non-zero exit codes
            result = subprocess.run(["helm"] + args, check=True, capture_output=True, text=True)
            return result.stdout
        except subprocess.CalledProcessError as e:
            logger.error(f"Helm command failed: {e.stderr}")
            raise Exception(f"Helm error: {e.stderr}")
        except FileNotFoundError:
            logger.error("Helm CLI not found in PATH")
            raise Exception("Helm CLI not found. Please ensure Helm is installed.")

    def deploy(self, release_name: str, template_path: str, values_path: str, namespace: str, overrides: Optional[Dict[str, str]] = None):
        """
        Executes helm upgrade --install with optional overrides.
        """
        args = [
            "upgrade", "--install",
            release_name,
            template_path,
            "-f", values_path,
            "-n", namespace,
            "--create-namespace" # Ensure namespace exists
        ]
        
        if overrides:
            for key, value in overrides.items():
                args.extend(["--set", f"{key}={value}"])
                
        return self._run_helm_command(args)

    def delete(self, release_name: str, namespace: str):
        """
        Executes helm uninstall
        """
        args = ["uninstall", release_name, "-n", namespace]
        return self._run_helm_command(args)

    def list_releases(self, namespace: Optional[str] = None) -> str:
        """
        Executes helm list
        """
        args = ["list", "-A", "--output", "json"]
        if namespace:
            args = ["list", "-n", namespace, "--output", "json"]
        return self._run_helm_command(args)

    def get_status(self, release_name: str, namespace: str):
        """
        Executes helm status
        """
        args = ["status", release_name, "-n", namespace, "--output", "json"]
        return self._run_helm_command(args)
