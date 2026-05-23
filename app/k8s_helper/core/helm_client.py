import subprocess
import json
import os
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any, List

# Isolated helm home — keeps all helm state (repos, cache, plugins) out of
# the project root and away from any system-wide helm installation.
# Can be overridden via the CLOUD_OPS_HELM_HOME env var.
HELM_HOME = Path(os.getenv("CLOUD_OPS_HELM_HOME", Path.home() / ".cache" / "cloud_ops" / "helm"))

def _helm_env() -> Dict[str, str]:
    """Build an environment dict that redirects all helm state to HELM_HOME."""
    data_home  = str(HELM_HOME / "data")
    config_home = str(HELM_HOME / "config")
    cache_home  = str(HELM_HOME / "cache")

    # Ensure directories exist before helm tries to write to them
    for d in [data_home, config_home, cache_home]:
        os.makedirs(d, exist_ok=True)

    env = os.environ.copy()
    env.update({
        "HELM_DATA_HOME":   data_home,
        "HELM_CONFIG_HOME": config_home,
        "HELM_CACHE_HOME":  cache_home,
    })
    return env


class HelmClient:
    """
    Thin wrapper around the `helm` CLI.

    All commands run with:
      - An isolated HELM_HOME so project root / system config are never touched.
      - cwd set to HELM_HOME (never the project root).
      - Values overrides written to a temp file that is cleaned up immediately.
      - kubeconfig_path passed as --kubeconfig to every cluster-touching call so
        helm never falls back to localhost:8080.
    """

    _RUN_CWD = str(HELM_HOME)  # stable cwd; created lazily via _ensure_home()

    def __init__(self, kubeconfig_path: Optional[str] = None):
        """
        Args:
            kubeconfig_path: Absolute path to a managed kubeconfig file.
                This is REQUIRED for all cluster-facing operations.
                The platform no longer falls back to system-wide configurations.
        """
        self.kubeconfig_path = kubeconfig_path

    def _ensure_home(self) -> None:
        HELM_HOME.mkdir(parents=True, exist_ok=True)

    def _run(self, cmd: List[str]) -> str:
        """Run any helm command (no cluster access required)."""
        self._ensure_home()
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=_helm_env(),
            cwd=self._RUN_CWD,
        )
        if process.returncode != 0:
            raise RuntimeError(
                f"Helm command failed: {' '.join(cmd)}\n"
                f"stderr: {process.stderr.strip()}"
            )
        return process.stdout

    def _run_cluster(self, cmd: List[str]) -> str:
        """Run a helm command that requires Kubernetes cluster access.
        
        Injects --kubeconfig. This is MANDATORY to ensure helm never falls back
        to the system-wide ~/.kube/config or http://localhost:8080.
        """
        if not self.kubeconfig_path:
            raise RuntimeError(
                f"Managed kubeconfig path is required for cluster operation: {' '.join(cmd)}. "
                "The platform must maintain its own source of truth for Kubernetes state."
            )
            
        # Insert right after 'helm <subcommand>'
        cmd = cmd[:2] + ["--kubeconfig", self.kubeconfig_path] + cmd[2:]
        return self._run(cmd)

    # ------------------------------------------------------------------
    # Repository management
    # ------------------------------------------------------------------

    def add_repo(self, repo_name: str, repo_url: str) -> str:
        """Register a helm repository (idempotent — safe to call repeatedly)."""
        return self._run(["helm", "repo", "add", "--force-update", repo_name, repo_url])

    def update_repos(self) -> str:
        """Refresh the local repo index cache."""
        return self._run(["helm", "repo", "update"])

    # ------------------------------------------------------------------
    # Release lifecycle
    # ------------------------------------------------------------------

    def install_chart(
        self,
        release_name: str,
        chart: str,
        namespace: str = "default",
        version: Optional[str] = None,
        values: Optional[str] = None,
    ) -> str:
        """
        Install or upgrade a helm release.

        ``values`` should be a YAML string.  It is written to a temp file that
        is deleted as soon as helm exits — nothing persists to disk long-term.
        """
        cmd = [
            "helm", "upgrade", "--install",
            release_name, chart,
            "--namespace", namespace,
            "--create-namespace",
        ]
        if version:
            cmd.extend(["--version", version])

        if values and values.strip():
            # Write values to a NamedTemporaryFile outside the project directory
            with tempfile.NamedTemporaryFile(
                mode="w",
                suffix=".yaml",
                prefix="cloud_ops_helm_values_",
                dir=str(HELM_HOME / "cache"),   # inside our isolated home
                delete=False,
            ) as vf:
                vf.write(values)
                values_path = vf.name
            try:
                cmd.extend(["-f", values_path])
                return self._run_cluster(cmd)
            finally:
                # Always clean up the temp values file
                try:
                    os.unlink(values_path)
                except OSError:
                    pass
        else:
            return self._run_cluster(cmd)

    def uninstall_chart(self, release_name: str, namespace: str = "default") -> str:
        return self._run_cluster(["helm", "uninstall", release_name, "--namespace", namespace])

    # ------------------------------------------------------------------
    # Status / introspection
    # ------------------------------------------------------------------

    def get_release_status(self, release_name: str, namespace: str = "default") -> Dict[str, Any]:
        """
        Returns the parsed status dict for a release, or {} if not found.
        Never raises for a missing release — callers treat {} as "not installed".
        """
        try:
            output = self._run_cluster(["helm", "status", release_name, "--namespace", namespace, "-o", "json"])
            return json.loads(output)
        except RuntimeError as e:
            if "not found" in str(e).lower() or "release: not found" in str(e).lower():
                return {}
            raise

    def list_releases(self, namespace: str = "default") -> List[Dict[str, Any]]:
        output = self._run_cluster(["helm", "list", "--namespace", namespace, "-o", "json"])
        return json.loads(output)

    def list_all_releases(self) -> List[Dict[str, Any]]:
        """List all releases in all namespaces."""
        output = self._run_cluster(["helm", "list", "-A", "-o", "json"])
        return json.loads(output)

    def get_chart_values(self, repo_name: str, repo_url: str, chart: str) -> str:
        """
        Fetch the upstream default values.yaml for a chart.
        Adds and updates the repo first (idempotent), then runs:
            helm show values <chart>
        Returns the raw YAML string.
        """
        self.add_repo(repo_name, repo_url)
        self.update_repos()
        return self._run(["helm", "show", "values", chart])
