from .stack import get_pvc_manifest

DEFAULT_LOKI_CONFIG = """auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  instance_addr: 127.0.0.1
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://alertmanager-service.alerting.svc.cluster.local:80
"""

DEFAULT_PROMTAIL_CONFIG = """server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /run/promtail/positions.yaml

clients:
  - url: http://loki.logging.svc.cluster.local:3100/loki/api/v1/push

scrape_configs:
  - job_name: kubernetes-pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_node_name]
        target_label: __host__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - action: replace
        replacement: $1
        separator: /
        source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_pod_name]
        target_label: job
      - action: replace
        source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
      - action: replace
        source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      - action: replace
        source_labels: [__meta_kubernetes_pod_container_name]
        target_label: container
      - replacement: /var/log/pods/*$1/*.log
        separator: /
        source_labels: [__meta_kubernetes_pod_uid, __meta_kubernetes_pod_container_name]
        target_label: __path__
"""

def get_loki_manifests(namespace="logging"):
    """
    Returns manifests for Loki (Deployment, Service, PVC, ConfigMap).
    """
    return [
        # Loki ConfigMap
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "loki-config", "namespace": namespace},
            "data": {
                "loki.yaml": DEFAULT_LOKI_CONFIG
            }
        },
        # Loki PVC
        get_pvc_manifest("loki-storage", namespace, "5Gi"),
        # Loki Deployment
        {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {"name": "loki", "namespace": namespace},
            "spec": {
                "replicas": 1,
                "selector": {"matchLabels": {"app": "loki"}},
                "template": {
                    "metadata": {"labels": {"app": "loki"}},
                    "spec": {
                        "containers": [
                            {
                                "name": "loki",
                                "image": "grafana/loki:2.9.2",
                                "args": ["-config.file=/etc/loki/loki.yaml"],
                                "ports": [{"containerPort": 3100, "name": "http"}],
                                "volumeMounts": [
                                    {"name": "config", "mountPath": "/etc/loki"},
                                    {"name": "storage", "mountPath": "/loki"}
                                ]
                            }
                        ],
                        "volumes": [
                            {"name": "config", "configMap": {"name": "loki-config"}},
                            {"name": "storage", "persistentVolumeClaim": {"claimName": "loki-storage"}}
                        ]
                    }
                }
            }
        },
        # Loki Service
        {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {"name": "loki", "namespace": namespace},
            "spec": {
                "selector": {"app": "loki"},
                "ports": [{"port": 3100, "targetPort": 3100, "name": "http"}],
                "type": "ClusterIP"
            }
        }
    ]

def get_promtail_manifests(namespace="logging"):
    """
    Returns manifests for Promtail (DaemonSet, RBAC, ConfigMap).
    """
    return [
        # Promtail ServiceAccount
        {
            "apiVersion": "v1",
            "kind": "ServiceAccount",
            "metadata": {"name": "promtail", "namespace": namespace}
        },
        # Promtail ClusterRole (Needs access to pods/nodes for discovery)
        {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRole",
            "metadata": {"name": "promtail-clusterrole"},
            "rules": [
                {
                    "apiGroups": [""],
                    "resources": ["nodes", "nodes/proxy", "services", "endpoints", "pods"],
                    "verbs": ["get", "watch", "list"]
                }
            ]
        },
        # Promtail ClusterRoleBinding
        {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRoleBinding",
            "metadata": {"name": "promtail-clusterrolebinding"},
            "subjects": [
                {"kind": "ServiceAccount", "name": "promtail", "namespace": namespace}
            ],
            "roleRef": {
                "kind": "ClusterRole",
                "name": "promtail-clusterrole",
                "apiGroup": "rbac.authorization.k8s.io"
            }
        },
        # Promtail ConfigMap
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "promtail-config", "namespace": namespace},
            "data": {
                "promtail.yaml": DEFAULT_PROMTAIL_CONFIG
            }
        },
        # Promtail DaemonSet
        {
            "apiVersion": "apps/v1",
            "kind": "DaemonSet",
            "metadata": {"name": "promtail", "namespace": namespace},
            "spec": {
                "selector": {"matchLabels": {"app": "promtail"}},
                "template": {
                    "metadata": {"labels": {"app": "promtail"}},
                    "spec": {
                        "serviceAccountName": "promtail",
                        "containers": [
                            {
                                "name": "promtail",
                                "image": "grafana/promtail:2.9.2",
                                "args": ["-config.file=/etc/promtail/promtail.yaml"],
                                "volumeMounts": [
                                    {"name": "config", "mountPath": "/etc/promtail"},
                                    {"name": "run", "mountPath": "/run/promtail"},
                                    {"name": "containers", "mountPath": "/var/lib/docker/containers", "readOnly": True},
                                    {"name": "pods", "mountPath": "/var/log/pods", "readOnly": True}
                                ]
                            }
                        ],
                        "volumes": [
                            {"name": "config", "configMap": {"name": "promtail-config"}},
                            {"name": "run", "hostPath": {"path": "/run/promtail"}},
                            {"name": "containers", "hostPath": {"path": "/var/lib/docker/containers"}},
                            {"name": "pods", "hostPath": {"path": "/var/log/pods"}}
                        ]
                    }
                }
            }
        }
    ]
