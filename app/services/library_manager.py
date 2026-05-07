import os
import yaml
from typing import List, Dict, Optional, Any
import logging
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from sqlmodel import select

logger = logging.getLogger(__name__)

STORAGE_ROOT = os.path.join(os.getcwd(), "storage", "library")

# All charts live directly under STORAGE_ROOT/{chart_name}/
# Values files live as {chart_name}/{env_name}.yaml alongside Chart.yaml
# Helm templates live under {chart_name}/templates/

class LibraryManager:
    def _chart_path(self, chart_name: str) -> str:
        return os.path.join(STORAGE_ROOT, chart_name)

    def _values_path(self, chart_name: str, env_name: str) -> str:
        filename = "values.yaml" if env_name == "default" else f"{env_name}.yaml"
        return os.path.join(STORAGE_ROOT, chart_name, filename)

    # ── Templates ──────────────────────────────────────────────────────────────

    def list_templates(self) -> List[str]:
        if not os.path.exists(STORAGE_ROOT):
            return []
        return [
            d for d in os.listdir(STORAGE_ROOT)
            if os.path.isdir(os.path.join(STORAGE_ROOT, d))
            and not d.startswith(".")
            and os.path.exists(os.path.join(STORAGE_ROOT, d, "Chart.yaml"))
        ]

    def get_template_path(self, chart_name: str) -> str:
        return self._chart_path(chart_name)

    def delete_template(self, chart_name: str):
        import shutil
        
        # Safety check
        from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
        dm = DeploymentManager()
        deployments = dm.session.exec(select(DeploymentConfig).where(DeploymentConfig.chart_name == chart_name)).all()
        if deployments:
            raise Exception(f"Cannot delete chart '{chart_name}' because it is in use by {len(deployments)} release configurations.")

        chart_path = self._chart_path(chart_name)
        if os.path.exists(chart_path):
            shutil.rmtree(chart_path)
            
            # Commit deletion
            from app.services.library_version_manager import LibraryVersionManager
            lvm = LibraryVersionManager()
            lvm.commit(f"Deleted chart template '{chart_name}'")

    # ── Values (per-environment overrides) ─────────────────────────────────────

    def list_values(self, chart_name: Optional[str] = None) -> List[Dict]:
        """
        Returns all environment value files across all charts (or for one chart).
        A values file is any .yaml in the chart root that is NOT Chart.yaml or values.yaml.
        """
        results = []
        charts = [chart_name] if chart_name else self.list_templates()
        
        # Get usage info
        from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
        dm = DeploymentManager()
        deployments = dm.session.exec(select(DeploymentConfig)).all()
        
        for chart in charts:
            chart_path = self._chart_path(chart)
            if not os.path.isdir(chart_path):
                continue
                
            # Filter deployments for this chart to check env usage
            chart_deployments = [d for d in deployments if d.chart_name == chart]
            used_envs = {d.env_name for d in chart_deployments if d.env_name}

            for filename in os.listdir(chart_path):
                if filename.endswith(".yaml") and filename not in ["Chart.yaml", "values.yaml"]:
                    env_name = filename[:-5]  # strip .yaml
                    results.append({
                        "template": chart,
                        "env_name": env_name,
                        "in_use": env_name in used_envs
                    })
        return results

    def get_values(self, chart_name: str, env_name: str) -> Optional[Dict]:
        file_path = self._values_path(chart_name, env_name)
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r") as f:
            return yaml.safe_load(f) or {}

    def get_values_raw(self, chart_name: str, env_name: str) -> Optional[str]:
        file_path = self._values_path(chart_name, env_name)
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r") as f:
            return f.read()

    def save_values(self, chart_name: str, env_name: str, content: Dict, message: str = "Update environment overrides"):
        """Save values as a dictionary (re-formats YAML)."""
        self.save_values_raw(chart_name, env_name, yaml.dump(content, default_flow_style=False), message)

    def save_values_raw(self, chart_name: str, env_name: str, content: str, message: str = "Update environment overrides"):
        """Save values as a raw string (preserves formatting/comments)."""
        if env_name.lower() in ["chart", "values"]:
            raise Exception(f"Cannot use reserved name '{env_name}' as environment name")

        chart_path = self._chart_path(chart_name)
        os.makedirs(chart_path, exist_ok=True)

        file_path = self._values_path(chart_name, env_name)
        filename = os.path.basename(file_path)

        with open(file_path, "w") as f:
            f.write(content)
            
        # Commit change
        from app.services.library_version_manager import LibraryVersionManager
        lvm = LibraryVersionManager()
        lvm.commit(f"{message}: {chart_name}/{env_name}", chart_name=chart_name, file_path=os.path.join(chart_name, filename))
        
        return self._check_auto_sync()

    def _check_auto_sync(self):
        """Returns True if auto_sync is enabled and should be run in background."""
        from app.db_client.db import get_session
        from app.db_client.models.library_setting.library_setting import LibrarySetting
        from sqlmodel import select
        with get_session() as session:
            setting = session.exec(select(LibrarySetting)).first()
            return setting and setting.auto_push

    def delete_values(self, chart_name: str, env_name: str):
        # Safety check
        from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
        dm = DeploymentManager()
        deployments = dm.session.exec(select(DeploymentConfig).where(
            DeploymentConfig.chart_name == chart_name,
            DeploymentConfig.env_name == env_name
        )).all()
        if deployments:
            raise Exception(f"Cannot delete environment '{env_name}' because it is in use by {len(deployments)} release configurations.")

        file_path = self._values_path(chart_name, env_name)
        if os.path.exists(file_path):
            os.remove(file_path)
            
            # Commit deletion
            from app.services.library_version_manager import LibraryVersionManager
            lvm = LibraryVersionManager()
            lvm.commit(f"Deleted environment '{env_name}' from chart '{chart_name}'", chart_name=chart_name)
            
            return self._check_auto_sync()
        return False

    # ── Index ──────────────────────────────────────────────────────────────────

    def index_library(self) -> List[Dict]:
        index = []
        from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
        dm = DeploymentManager()
        deployments = dm.session.exec(select(DeploymentConfig)).all()
        used_charts = {d.chart_name for d in deployments if d.chart_name}

        for chart in self.list_templates():
            index.append({
                "type": "template",
                "id": f"template:{chart}",
                "name": chart,
                "display_name": chart,
                "template": chart,
                "actions": ["edit", "delete"],
                "in_use": chart in used_charts
            })
        return index
