import requests
import json
import logging

def get_namespace_manifest(namespace):
    return {
        "apiVersion": "v1",
        "kind": "Namespace",
        "metadata": {"name": namespace}
    }

def get_prometheus_manifests(namespace="monitoring"):
    """
    Returns a list of Kubernetes manifests for Prometheus.
    """
    return [
        # Prometheus RBAC: ClusterRole
        {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRole",
            "metadata": {"name": f"prometheus-server-{namespace}"},
            "rules": [
                {
                    "apiGroups": [""],
                    "resources": ["nodes", "nodes/proxy", "services", "endpoints", "pods"],
                    "verbs": ["get", "list", "watch"]
                },
                {
                    "apiGroups": ["extensions", "apps"],
                    "resources": ["ingresses"],
                    "verbs": ["get", "list", "watch"]
                }
            ]
        },
        # Prometheus RBAC: ServiceAccount
        {
            "apiVersion": "v1",
            "kind": "ServiceAccount",
            "metadata": {"name": "prometheus-server", "namespace": namespace}
        },
        # Prometheus RBAC: ClusterRoleBinding
        {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRoleBinding",
            "metadata": {"name": f"prometheus-server-{namespace}"},
            "roleRef": {
                "apiGroup": "rbac.authorization.k8s.io",
                "kind": "ClusterRole",
                "name": f"prometheus-server-{namespace}"
            },
            "subjects": [
                {"kind": "ServiceAccount", "name": "prometheus-server", "namespace": namespace}
            ]
        },
        # Prometheus ConfigMap
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "prometheus-server-conf", "namespace": namespace},
            "data": {
                "prometheus.yml": """
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'kubernetes-apiservers'
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

  - job_name: 'kubernetes-nodes'
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

  - job_name: 'kubernetes-cadvisor'
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
"""
            }
        },
        # Prometheus Deployment
        {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {"name": "prometheus-deployment", "namespace": namespace},
            "spec": {
                "replicas": 1,
                "selector": {"matchLabels": {"app": "prometheus-server"}},
                "template": {
                    "metadata": {"labels": {"app": "prometheus-server"}},
                    "spec": {
                        "serviceAccountName": "prometheus-server",
                        "containers": [
                            {
                                "name": "prometheus",
                                "image": "prom/prometheus:v2.45.0",
                                "args": [
                                    "--config.file=/etc/prometheus/prometheus.yml",
                                    "--storage.tsdb.path=/prometheus/"
                                ],
                                "ports": [{"containerPort": 9090}],
                                "volumeMounts": [
                                    {"name": "prometheus-config-volume", "mountPath": "/etc/prometheus/"},
                                    {"name": "prometheus-storage-volume", "mountPath": "/prometheus/"}
                                ]
                            }
                        ],
                        "volumes": [
                            {"name": "prometheus-config-volume", "configMap": {"name": "prometheus-server-conf"}},
                            {"name": "prometheus-storage-volume", "emptyDir": {}}
                        ]
                    }
                }
            }
        },
        # Prometheus Service
        {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {"name": "prometheus-service", "namespace": namespace},
            "spec": {
                "selector": {"app": "prometheus-server"},
                "ports": [{"port": 80, "targetPort": 9090}],
                "type": "ClusterIP"
            }
        }
    ]

def get_k8s_dashboard_json():
    """
    Fetches the official Kubernetes Cluster Monitoring dashboard (ID 315).
    """
    try:
        # Fetching latest revision of dashboard 315
        url = "https://grafana.com/api/dashboards/315/revisions/latest/download"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        dashboard = response.json()
        
        # Remove __inputs (used for interactive UI import, breaks provisioning)
        dashboard.pop('__inputs', None)
        
        # Enforce a stable UID so URLs don't change or 404
        dashboard['uid'] = 'k8s-cluster-monitoring'
        dashboard['title'] = 'Kubernetes Cluster Monitoring'
        dashboard['overwrite'] = True 
        
        # Recursive function to fix datasource in all panels/queries
        def fix_datasource(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k == "datasource":
                        # Force use the prometheus UID
                        obj[k] = {"type": "prometheus", "uid": "prometheus"}
                    else:
                        fix_datasource(v)
            elif isinstance(obj, list):
                for item in obj:
                    fix_datasource(item)

        # Apply fix
        fix_datasource(dashboard)

        # Ensure the templating section has the DS_PROMETHEUS variable
        if "templating" not in dashboard:
            dashboard["templating"] = {"list": []}
        
        # Look for existing DS_PROMETHEUS or add it
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
        logging.warning(f"Failed to fetch Kubernetes Dashboard: {e}")
        return "{}"

def get_grafana_manifests(namespace="monitoring"):
    """
    Returns a list of Kubernetes manifests for Grafana, including auto-provisioning.
    """
    dashboard_json = get_k8s_dashboard_json()
    
    return [
        # Grafana ConfigMap: Data Sources
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "grafana-datasources", "namespace": namespace},
            "data": {
                "datasources.yaml": """
apiVersion: 1
datasources:
- name: Prometheus
  type: prometheus
  url: http://prometheus-service:80
  access: proxy
  isDefault: true
  uid: prometheus
"""
            }
        },
        # Grafana ConfigMap: Dashboard Provider
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "grafana-dashboards-provider", "namespace": namespace},
            "data": {
                "dashboards.yaml": """
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
            }
        },
        # Grafana ConfigMap: Kubernetes Dashboard JSON
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "grafana-dashboard-k8s", "namespace": namespace},
            "data": {
                "k8s-dashboard.json": dashboard_json
            }
        },
        # Grafana Deployment
        {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {"name": "grafana", "namespace": namespace},
            "spec": {
                "replicas": 1,
                "selector": {"matchLabels": {"app": "grafana"}},
                "template": {
                    "metadata": {"labels": {"app": "grafana"}},
                    "spec": {
                        "containers": [
                            {
                                "name": "grafana",
                                "image": "grafana/grafana:10.0.0",
                                "ports": [{"containerPort": 3000}],
                                "env": [
                                    {"name": "GF_AUTH_ANONYMOUS_ENABLED", "value": "true"},
                                    {"name": "GF_AUTH_ANONYMOUS_ORG_ROLE", "value": "Admin"},
                                    {"name": "GF_SERVER_ROOT_URL", "value": f"/cluster/proxy/grafana/{namespace}/"},
                                    {"name": "GF_SERVER_SERVE_FROM_SUB_PATH", "value": "false"},
                                    {"name": "GF_SECURITY_ALLOW_EMBEDDING", "value": "true"},
                                    # Relax security for proxy usage (dev environment)
                                    {"name": "GF_SECURITY_COOKIE_SAMESITE", "value": "none"}
                                ],
                                "volumeMounts": [
                                    {"name": "grafana-datasources", "mountPath": "/etc/grafana/provisioning/datasources", "readOnly": True},
                                    {"name": "grafana-dashboards-provider", "mountPath": "/etc/grafana/provisioning/dashboards", "readOnly": True},
                                    {"name": "grafana-dashboards", "mountPath": "/var/lib/grafana/dashboards/default", "readOnly": True}
                                ]
                            }
                        ],
                        "volumes": [
                            {"name": "grafana-datasources", "configMap": {"name": "grafana-datasources"}},
                            {"name": "grafana-dashboards-provider", "configMap": {"name": "grafana-dashboards-provider"}},
                            {"name": "grafana-dashboards", "configMap": {"name": "grafana-dashboard-k8s"}}
                        ]
                    }
                }
            }
        },
        # Grafana Service
        {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {"name": "grafana", "namespace": namespace},
            "spec": {
                "selector": {"app": "grafana"},
                "ports": [{"port": 80, "targetPort": 3000}],
                "type": "ClusterIP"
            }
        }
    ]

def get_node_exporter_manifests(namespace="monitoring"):
    """
    Returns manifests for Node Exporter DaemonSet and Service.
    """
    return [
        {
            "apiVersion": "apps/v1",
            "kind": "DaemonSet",
            "metadata": {"name": "node-exporter", "namespace": namespace},
            "spec": {
                "selector": {"matchLabels": {"app": "node-exporter"}},
                "template": {
                    "metadata": {"labels": {"app": "node-exporter"}},
                    "spec": {
                        "containers": [
                            {
                                "name": "node-exporter",
                                "image": "prom/node-exporter:v1.6.1",
                                "ports": [{"containerPort": 9100, "name": "metrics"}],
                                "volumeMounts": [
                                    {"name": "proc", "mountPath": "/host/proc", "readOnly": True},
                                    {"name": "sys", "mountPath": "/host/sys", "readOnly": True},
                                    {"name": "root", "mountPath": "/rootfs", "readOnly": True}
                                ],
                                "args": [
                                    "--path.procfs=/host/proc",
                                    "--path.sysfs=/host/sys",
                                    "--path.rootfs=/rootfs",
                                    "--collector.filesystem.ignored-mount-points=^/(dev|proc|sys|var/lib/docker/.+)($|/)"
                                ]
                            }
                        ],
                        "volumes": [
                            {"name": "proc", "hostPath": {"path": "/proc"}},
                            {"name": "sys", "hostPath": {"path": "/sys"}},
                            {"name": "root", "hostPath": {"path": "/"}}
                        ],
                        "hostNetwork": True,
                        "hostPID": True,
                    }
                }
            }
        },
        {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": "node-exporter", 
                "namespace": namespace,
                "annotations": {"prometheus.io/scrape": "true", "prometheus.io/port": "9100"}
            },
            "spec": {
                "selector": {"app": "node-exporter"},
                "ports": [{"port": 9100, "targetPort": 9100, "name": "metrics"}],
                "type": "ClusterIP"
            }
        }
    ]

def get_monitoring_manifests(namespace="monitoring"):
    """
    Returns a combined list of manifests.
    """
    return [get_namespace_manifest(namespace)] + \
           get_prometheus_manifests(namespace) + \
           get_grafana_manifests(namespace) + \
           get_node_exporter_manifests(namespace)
