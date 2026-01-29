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

def get_grafana_manifests(namespace="monitoring"):
    """
    Returns a list of Kubernetes manifests for Grafana.
    """
    return [
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
                                    {"name": "GF_SERVER_SERVE_FROM_SUB_PATH", "value": "true"}
                                ]
                            }
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

def get_monitoring_manifests(namespace="monitoring"):
    """
    Returns a combined list of manifests.
    """
    return [get_namespace_manifest(namespace)] + get_prometheus_manifests(namespace) + get_grafana_manifests(namespace)
