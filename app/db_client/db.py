from sqlmodel import SQLModel, create_engine, Session
import os
from sqlmodel import Session, select
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

# --- DB Engine and Session Management ---
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "example")
POSTGRES_DB = os.getenv("POSTGRES_DB", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

from kubernetes import client, config
from kubernetes.client.rest import ApiException

engine = create_engine(DATABASE_URL)

@contextmanager
def get_session():
    with Session(engine) as session:
        yield session

# --- Import all models to register them with SQLModel ---
from .models import *

DEFAULT_STRATEGIES = [
    {"id": 1, "name": "rolling", "description": "Rolling update strategy that gradually replaces old pods with new ones"},
    {"id": 2, "name": "blue-green", "description": "Deploy new version (green) alongside old version (blue), then switch traffic"},
    {"id": 3, "name": "canary", "description": "Release to a subset of users before full rollout"},
    {"id": 4, "name": "recreate", "description": "Terminate all existing pods before creating new ones"},
]

DEFAULT_ADDONS = [
    {
        "name": "openebs", "display_name": "OpenEBS Replicated Storage", "description": "Highly available, replicated block storage for production-ready persistence.",
        "category": "Storage & Persistence", "icon_name": "Database",
        "helm_repo_url": "https://openebs.github.io/charts", "helm_repo_name": "openebs", "helm_chart_name": "openebs/openebs",
        "namespace": "openebs", "is_system": True
    },
    {
        "name": "flannel", "display_name": "Flannel", "description": "Simple and easy way to configure a layer 3 network fabric designed for Kubernetes.",
        "category": "Networking & Connectivity", "icon_name": "Activity",
        "helm_repo_url": "https://flannel-io.github.io/flannel/", "helm_repo_name": "flannel", "helm_chart_name": "flannel/flannel",
        "namespace": "kube-flannel", "is_system": True
    },
    {
        "name": "prometheus", "display_name": "Prometheus", "description": "Professional-grade time series database and monitoring server.",
        "category": "System Metrics", "icon_name": "Database",
        "helm_repo_url": "https://prometheus-community.github.io/helm-charts", "helm_repo_name": "prometheus-community", "helm_chart_name": "prometheus-community/prometheus",
        "namespace": "monitoring", "is_system": True, "proxy_url": "http://prometheus-server.monitoring.localhost", "service_port": 80
    },
    {
        "name": "grafana", "display_name": "Grafana", "description": "The open and composable observability and data visualization platform.",
        "category": "Visualization Dashboards", "icon_name": "LayoutDashboard",
        "helm_repo_url": "https://grafana.github.io/helm-charts", "helm_repo_name": "grafana", "helm_chart_name": "grafana/grafana",
        "namespace": "monitoring", "is_system": True, "proxy_url": "http://grafana.monitoring.localhost", "service_port": 80
    },
    {
        "name": "alertmanager", "display_name": "Alertmanager", "description": "Handles alerts sent by client applications such as Prometheus. Manages silences, inhibition, and notification routing.",
        "category": "Alerting & Notifications", "icon_name": "AlertCircle",
        "helm_repo_url": "https://prometheus-community.github.io/helm-charts", "helm_repo_name": "prometheus-community", "helm_chart_name": "prometheus-community/alertmanager",
        "namespace": "monitoring", "is_system": True, "proxy_url": "http://alertmanager.monitoring.localhost", "service_port": 9093
    },
    {
        "name": "loki", "display_name": "Loki", "description": "Horizontally-scalable, highly-available, multi-tenant log aggregation system.",
        "category": "Logging & Infrastructure", "icon_name": "Database",
        "helm_repo_url": "https://grafana.github.io/helm-charts", "helm_repo_name": "grafana", "helm_chart_name": "grafana/loki",
        "namespace": "logging", "is_system": True
    },
    {
        "name": "promtail", "display_name": "Promtail", "description": "Native log shipping agent that discovers targets and enriches logs with labels.",
        "category": "Logging & Infrastructure", "icon_name": "FileSearch",
        "helm_repo_url": "https://grafana.github.io/helm-charts", "helm_repo_name": "grafana", "helm_chart_name": "grafana/promtail",
        "namespace": "logging", "is_system": True
    },
    {
        "name": "opentelemetry-collector", "display_name": "OTel Collector", "description": "The universal, standard-compliant observability agent for modern clusters.",
        "category": "Logging & Infrastructure", "icon_name": "Activity",
        "helm_repo_url": "https://open-telemetry.github.io/opentelemetry-helm-charts", "helm_repo_name": "open-telemetry", "helm_chart_name": "open-telemetry/opentelemetry-collector",
        "namespace": "logging", "is_system": True
    },
    {
        "name": "metrics-server", "display_name": "Metrics Server", "description": "Cluster-wide aggregator of resource usage data.",
        "category": "System Metrics", "icon_name": "Activity",
        "helm_repo_url": "https://kubernetes-sigs.github.io/metrics-server/", "helm_repo_name": "metrics-server", "helm_chart_name": "metrics-server/metrics-server",
        "namespace": "kube-system", "is_system": True
    }
]

def ensure_default_strategies(force: bool = False):
    if os.getenv("RENDER_RELAY_BUILD_MODE") == "True":
        return
    with Session(engine) as session:
        for strat in DEFAULT_STRATEGIES:
            existing = session.exec(select(DeploymentStrategy).where(DeploymentStrategy.id == strat["id"])).first()
            if not existing:
                session.add(DeploymentStrategy(**strat))
            elif force:
                for key, value in strat.items():
                    setattr(existing, key, value)
                session.add(existing)
        session.commit()

def ensure_default_essential_addons(force: bool = False):
    if os.getenv("RENDER_RELAY_BUILD_MODE") == "True":
        logger.info("Build mode detected, skipping addon seeding.")
        return

    from app.db_client.models.addon_plugin.addon_plugin import AddonPlugin
    
    # Check if we actually need to do anything before doing expensive setup
    needs_seeding = False
    with Session(engine) as session:
        for addon_data in DEFAULT_ADDONS:
            existing = session.exec(select(AddonPlugin).where(AddonPlugin.name == addon_data["name"])).first()
            if not existing or (force or not existing.default_values):
                needs_seeding = True
                break
    
    if not needs_seeding:
        logger.info("All essential addons already seeded. Skipping K8s/Helm setup.")
        return

    from app.k8s_helper.core.helm_client import HelmClient
    helm_client = HelmClient()
    
    # Ensure 'standard' StorageClass exists directly via K8s API (more reliable than helm values for this specific legacy need)
    try:
        config.load_incluster_config()
    except:
        try:
            config.load_kube_config()
        except:
            logger.warning("Failed to load kube config in seeder, StorageClass may not be created.")
    
    storage_api = client.StorageV1Api()
    standard_sc = {
        "apiVersion": "storage.k8s.io/v1",
        "kind": "StorageClass",
        "metadata": {
            "name": "standard",
            "annotations": {
                "storageclass.kubernetes.io/is-default-class": "true"
            }
        },
        "provisioner": "openebs.io/local",
        "volumeBindingMode": "WaitForFirstConsumer",
        "reclaimPolicy": "Delete"
    }
    
    try:
        storage_api.create_storage_class(standard_sc)
        logger.info("Directly created 'standard' StorageClass via K8s API.")
    except ApiException as e:
        if e.status == 409: # Already exists
            if force:
                try:
                    storage_api.patch_storage_class("standard", standard_sc)
                    logger.info("Patched existing 'standard' StorageClass via K8s API.")
                except Exception as patch_e:
                    logger.warning(f"Failed to patch existing StorageClass: {patch_e}")
        else:
            logger.warning(f"Failed to create StorageClass: {e}")

    with Session(engine) as session:
        for addon_data in DEFAULT_ADDONS:
            existing = session.exec(select(AddonPlugin).where(AddonPlugin.name == addon_data["name"])).first()
            
            # Helper to fetch and inject opinionated defaults
            def get_values():
                try:
                    # Store ONLY the opinionated overrides (delta) in the DB.
                    # Helm will automatically merge these with the chart's built-in defaults at install time.
                    val = ""
                    
                    if addon_data["name"] == "metrics-server":
                        # We use the defaults from addon_defaults.py but can also hardcode overrides here if needed
                        val = """
args:
  - --kubelet-insecure-tls
  - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
  - --cert-dir=/tmp
"""
                    
                    elif addon_data["name"] == "openebs":
                        # Restore legacy 'standard' StorageClass as default
                        # Using both potential keys (chart versions vary) to ensure the 'standard' class is created
                        val += """
localpv-provisioner:
  storageClass:
    create: true
    name: "standard"
    isDefaultClass: true
localprovisioner:
  storageClass:
    create: true
    name: "standard"
    isDefaultClass: true
"""
                    
                    elif addon_data["name"] == "prometheus":
                        # Force use of the 'standard' storage class
                        val += """
server:
  persistentVolume:
    storageClass: "standard"
alertmanager:
  enabled: false
"""
                        # Restore ONLY the extra scrape jobs to avoid clashing with Helm chart's own 'global'/'scrape_configs'
                        from app.db_client.addon_defaults import DEFAULT_PROMETHEUS_CONFIG
                        import yaml
                        try:
                            legacy_config = yaml.safe_load(DEFAULT_PROMETHEUS_CONFIG)
                            scrape_jobs = legacy_config.get("scrape_configs", [])
                            if scrape_jobs:
                                # Inject only the list of jobs into extraScrapeConfigs
                                val += "\nextraScrapeConfigs: |\n" + "\n".join(["  " + line for line in yaml.dump(scrape_jobs).splitlines()])
                            
                            # Point Prometheus to the new standalone Alertmanager service
                            val += """
alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - "alertmanager.monitoring.svc.cluster.local:80"
"""
                        except Exception as e:
                            logger.warning(f"Failed to parse legacy prometheus config: {e}")

                    elif addon_data["name"] == "loki":
                        # Loki 3.x requires explicit SingleBinary, zeroed targets, and a schemaConfig
                        val += """
deploymentMode: SingleBinary
loki:
  commonConfig:
    replication_factor: 1
  storage:
    type: 'filesystem'
  schemaConfig:
    configs:
      - from: "2024-01-01"
        store: tsdb
        object_store: filesystem
        schema: v13
        index:
          prefix: index_
          period: 24h
  auth_enabled: false
singleBinary:
  replicas: 1
  persistence:
    enabled: true
    storageClass: "standard"
    size: 5Gi
read:
  replicas: 0
write:
  replicas: 0
backend:
  replicas: 0
"""

                    elif addon_data["name"] == "grafana":
                        # Restore legacy anonymous access and proxy settings
                        val += """
grafana.ini:
  auth.anonymous:
    enabled: true
    org_role: Admin
  server:
    root_url: "%(protocol)s://%(domain)s:%(http_port)s/cluster/proxy/grafana/monitoring/"
    serve_from_sub_path: true

dashboardProviders:
  dashboardproviders.yaml:
    apiVersion: 1
    providers:
    - name: 'default'
      orgId: 1
      folder: ''
      type: file
      disableDeletion: false
      editable: true
      options:
        path: /var/lib/grafana/dashboards/default
"""
                        # Restore legacy datasources
                        from app.db_client.addon_defaults import DEFAULT_GRAFANA_DATASOURCES
                        datasource_section = "\ndatasources:\n  datasources.yaml:\n" + "\n".join(["    " + line for line in DEFAULT_GRAFANA_DATASOURCES.splitlines()])
                        val += datasource_section
                        
                        # Restore legacy dashboards
                        try:
                            from app.db_client.addon_defaults import get_k8s_dashboard_json, get_loki_dashboard_json
                            k8s_json = get_k8s_dashboard_json()
                            loki_json = get_loki_dashboard_json()
                            
                            def indent_json(json_str, spaces):
                                return "\n".join([" " * spaces + line for line in json_str.splitlines()])

                            val += "\ndashboards:\n  default:\n"
                            if k8s_json and len(k8s_json) > 10:
                                val += f"    k8s-cluster:\n      json: |\n{indent_json(k8s_json, 8)}\n"
                            if loki_json and len(loki_json) > 10:
                                val += f"    loki-logs:\n      json: |\n{indent_json(loki_json, 8)}\n"
                        except Exception as e:
                            logger.warning(f"Failed to fetch dashboards for seeder: {e}")
                        
                    elif addon_data["name"] == "alertmanager":
                        # Restore legacy webhook configurations
                        from app.db_client.addon_defaults import DEFAULT_ALERTMANAGER_CONFIG
                        val += "config:\n" + "\n".join(["  " + line for line in DEFAULT_ALERTMANAGER_CONFIG.splitlines()])
                        # Set baseURL for proxy compatibility and map service to port 80
                        val += """
baseURL: "http://alertmanager.monitoring.localhost/"
service:
  type: ClusterIP
  port: 9093
  targetPort: 9093
persistence:
  enabled: true
  storageClass: "standard"
  size: 2Gi
"""
                    return val
                except Exception as e:
                    logger.error(f"Failed to fetch values for {addon_data['name']}: {e}")
                    return None

            if not existing:
                # New addon: fetch values first
                values = get_values()
                addon_data["default_values"] = values
                session.add(AddonPlugin(**addon_data))
                logger.info(f"Seeded new system addon: {addon_data['name']}")
            elif force or not existing.default_values:
                # Update existing if force=True or if values are empty
                values = get_values()
                if values:
                    existing.default_values = values
                    # Update other metadata from DEFAULT_ADDONS while at it
                    for key, value in addon_data.items():
                        setattr(existing, key, value)
                    session.add(existing)
                    logger.info(f"Refreshed default values for existing system addon: {addon_data['name']}")
        
        session.commit()

