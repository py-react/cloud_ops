import requests
import json
import logging
import yaml

logger = logging.getLogger(__name__)

GATEWAY_API_URL = "https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.0.0/standard-install.yaml"

def get_gateway_api_manifests(namespace="monitoring"):
    """
    Fetches the standard Kubernetes Gateway API v1.0.0 CRDs and returns them as a list of manifests.
    Includes the default main-gateway and a ConfigMap for UI configuration.
    """
    default_gateway_config = f"""apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: main-gateway
  namespace: {namespace}
spec:
  gatewayClassName: nginx
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    hostname: "*.example.com"
"""

    try:
        response = requests.get(GATEWAY_API_URL, timeout=30)
        response.raise_for_status()
        manifests = list(yaml.safe_load_all(response.content))
    except Exception as e:
        logger.error(f"Failed to fetch Gateway API manifests: {str(e)}")
        manifests = []
    
    # ConfigMap for the Gateway (allowing UI configuration)
    config_map = {
        "apiVersion": "v1",
        "kind": "ConfigMap",
        "metadata": {"name": "gateway-api-config", "namespace": namespace},
        "data": {
            "gateway.yaml": default_gateway_config
        }
    }

    # Default Gateway resource
    gateway_resource = {
        "apiVersion": "gateway.networking.k8s.io/v1",
        "kind": "Gateway",
        "metadata": {
            "name": "main-gateway",
            "namespace": namespace
        },
        "spec": {
            "gatewayClassName": "nginx",
            "listeners": [
                {
                    "name": "http",
                    "protocol": "HTTP",
                    "port": 80,
                    "hostname": "*.example.com"
                }
            ]
        }
    }
    
    return manifests + [config_map, gateway_resource]

DEFAULT_ALERTMANAGER_CONFIG = """global:
  resolve_timeout: 30s

route:
  group_by: ['alertname', 'instance']
  group_wait: 1s
  group_interval: 5s
  repeat_interval: 1m
  receiver: 'default-webhook'

  routes:
    - matchers:
        - severity="info"
      receiver: 'info-webhook'

    - matchers:
        - severity="warning"
      receiver: 'warning-webhook'

    - matchers:
        - severity="critical"
      receiver: 'critical-webhook'

receivers:
  - name: 'default-webhook'
    webhook_configs:
      - url: 'http://host.docker.internal:5001/api/monitoring/webhook/default'

  - name: 'info-webhook'
    webhook_configs:
      - url: 'http://host.docker.internal:5001/api/monitoring/webhook/info'

  - name: 'warning-webhook'
    webhook_configs:
      - url: 'http://host.docker.internal:5001/api/monitoring/webhook/warning'

  - name: 'critical-webhook'
    webhook_configs:
      - url: 'http://host.docker.internal:5001/api/monitoring/webhook/critical'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
"""

DEFAULT_PROMETHEUS_CONFIG = """global:
  scrape_interval: 5s
  evaluation_interval: 5s

rule_files:
  - /etc/prometheus/alert_rules.yml

alerting:
  alertmanagers:
  - kubernetes_sd_configs:
    - role: service
    relabel_configs:
    - source_labels: [__meta_kubernetes_service_name]
      regex: alertmanager-service
      action: keep
    - source_labels: [__meta_kubernetes_namespace]
      regex: alerting
      action: keep

scrape_configs:
  - job_name: 'legacy-kubernetes-apiservers'
    kubernetes_sd_configs:
    - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
      action: keep
      regex: default;kubernetes;https

  - job_name: 'legacy-kubernetes-nodes'
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    kubernetes_sd_configs:
    - role: node
    relabel_configs:
    - action: labelmap
      regex: __meta_kubernetes_node_label_(.+)
    - target_label: __address__
      replacement: kubernetes.default.svc:443
    - source_labels: [__meta_kubernetes_node_name]
      regex: (.+)
      target_label: __metrics_path__
      replacement: /api/v1/nodes/${1}/proxy/metrics

  - job_name: 'legacy-kubernetes-cadvisor'
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    kubernetes_sd_configs:
    - role: node
    relabel_configs:
    - action: labelmap
      regex: __meta_kubernetes_node_label_(.+)
    - target_label: __address__
      replacement: kubernetes.default.svc:443
    - source_labels: [__meta_kubernetes_node_name]
      regex: (.+)
      target_label: __metrics_path__
      replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor

  - job_name: 'node-exporter'
    kubernetes_sd_configs:
      - role: endpoints
    relabel_configs:
      - source_labels: [__meta_kubernetes_endpoints_name]
        regex: 'node-exporter'
        action: keep

  - job_name: 'kube-state-metrics'
    static_configs:
      - targets: ['kube-state-metrics:8080']
"""

DEFAULT_GRAFANA_DATASOURCES = """apiVersion: 1
datasources:
- name: Prometheus
  type: prometheus
  url: http://prometheus:80
  access: proxy
  isDefault: true
  uid: prometheus
- name: Loki
  type: loki
  url: http://loki.logging.svc.cluster.local:3100
  access: proxy
  uid: loki
"""

DEFAULT_GRAFANA_DASHBOARDS_PROVIDER_CONFIG = """apiVersion: 1
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

DEFAULT_METRICS_SERVER_CONFIG = """# Metrics Server Configuration
# These are the CLI arguments passed to the deployment.
- --cert-dir=/tmp
- --secure-port=4443
- --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
- --kubelet-use-node-status-port
- --metric-resolution=15s
- --kubelet-insecure-tls
"""

def get_k8s_dashboard_json():
    """
    Fetches the official Kubernetes Cluster Monitoring dashboard (ID 315).
    """
    try:
        url = "https://grafana.com/api/dashboards/315/revisions/latest/download"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        dashboard = response.json()
        dashboard.pop('__inputs', None)
        dashboard['uid'] = 'k8s-cluster-monitoring'
        dashboard['title'] = 'Kubernetes Cluster Monitoring'
        dashboard['overwrite'] = True 

        def fix_datasource(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k == "datasource":
                        obj[k] = {"type": "prometheus", "uid": "prometheus"}
                    else:
                        fix_datasource(v)
            elif isinstance(obj, list):
                for item in obj:
                    fix_datasource(item)

        fix_datasource(dashboard)

        if "templating" not in dashboard:
            dashboard["templating"] = {"list": []}
            
        found_var = False
        for var in dashboard.get("templating", {}).get("list", []):
            if var.get("name") == "DS_PROMETHEUS":
                var["current"] = {"text": "Prometheus", "value": "prometheus"}
                var["options"] = [{"selected": True, "text": "Prometheus", "value": "prometheus"}]
                var["query"] = "prometheus"
                found_var = True
                break
        
        if not found_var:
            if "list" not in dashboard["templating"]:
                dashboard["templating"]["list"] = []
            dashboard["templating"]["list"].append({
                "current": {"selected": True, "text": "Prometheus", "value": "prometheus"},
                "hide": 0,
                "label": "datasource",
                "name": "DS_PROMETHEUS",
                "options": [{"selected": True, "text": "Prometheus", "value": "prometheus"}],
                "query": "prometheus",
                "refresh": 1,
                "regex": "",
                "type": "datasource"
            })

        return json.dumps(dashboard)
    except Exception as e:
        logger.warning(f"Failed to fetch Kubernetes Dashboard: {e}")
        return "{}"

def get_loki_dashboard_json(title='Loki: Unified Logs', uid='loki-logs'):
    """
    Fetches a Loki Kubernetes Logs dashboard and adds an 'agent' variable for agnostic viewing.
    """
    try:
        url = "https://grafana.com/api/dashboards/12019/revisions/latest/download"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        dashboard = response.json()
        
        dashboard.pop('__inputs', None)
        dashboard['uid'] = uid
        dashboard['title'] = title
        dashboard['overwrite'] = True

        if "templating" not in dashboard:
            dashboard["templating"] = {"list": []}
            
        dashboard["templating"]["list"] = [v for v in dashboard["templating"]["list"] if v.get('name') != 'agent']
        
        dashboard["templating"]["list"].insert(0, {
            "allValue": ".*",
            "current": {"selected": True, "text": "All", "value": "$__all"},
            "datasource": {"type": "loki", "uid": "loki"},
            "definition": "label_values(agent)",
            "hide": 0,
            "includeAll": True,
            "label": "agent",
            "name": "agent",
            "options": [],
            "query": {"label": "agent", "refId": "LokiVariableQuery", "stream": "", "type": 1},
            "refresh": 1,
            "regex": "",
            "sort": 1,
            "type": "query"
        })

        def fix_loki_dashboard_logic(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k == "datasource":
                        if v == "${DS_LOKI}" or (isinstance(v, dict) and v.get("type") == "loki"):
                            obj[k] = {"type": "loki", "uid": "loki"}
                        elif v == "${DS_PROMETHEUS}" or (isinstance(v, dict) and v.get("type") == "prometheus"):
                            obj[k] = {"type": "prometheus", "uid": "prometheus"}
                    elif k == "expr" and isinstance(v, str):
                        if '{' in v and 'agent=' not in v:
                            v = v.replace('{', '{agent=~"$agent", ')
                        if 'instance=~"$pod"' in v:
                            v = v.replace('instance=~"$pod"', 'pod=~"$pod"')
                        obj[k] = v
                    else:
                        fix_loki_dashboard_logic(v)
            elif isinstance(obj, list):
                for item in obj:
                    fix_loki_dashboard_logic(item)
        
        fix_loki_dashboard_logic(dashboard)
        return json.dumps(dashboard)
    except Exception as e:
        logger.warning(f"Failed to fetch Loki Dashboard: {e}")
        return "{}"
