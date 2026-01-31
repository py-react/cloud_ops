from .stack import get_pvc_manifest

DEFAULT_LOKI_CONFIG = """auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
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
    - from: 2023-10-24
      store: tsdb
      object_store: filesystem
      schema: v12
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://alertmanager-service.alerting.svc.cluster.local:80
"""

DEFAULT_OTEL_COLLECTOR_CONFIG = """receivers:
  filelog:
    include: [ /var/log/pods/*/*/*.log ]
    include_file_path: true
    operators:
      - type: regex_parser
        id: extract_metadata_from_path
        parse_from: attributes["log.file.path"]
        regex: '^/var/log/pods/(?P<namespace>[^_]+)_(?P<pod>[^_]+)_(?P<uid>[^_/]+)/(?P<container>[^/]+)/.*'
      - type: move
        from: attributes.namespace
        to: resource["namespace"]
      - type: move
        from: attributes.pod
        to: resource["pod"]
      - type: move
        from: attributes.container
        to: resource["container"]
      - type: regex_parser
        id: cri_parser
        regex: '^(?P<time>[^ ]+) (?P<stream>stdout|stderr) (?P<logtag>[^ ]+) (?P<msg>.*)$'
      - type: move
        from: attributes.msg
        to: body

processors:
  batch:
    send_batch_size: 1000
    timeout: 5s
  resource:
    attributes:
      - key: job
        value: "kubernetes-pods"
        action: upsert
      - key: agent
        value: "otel"
        action: upsert
      - key: loki.resource.labels
        value: "namespace, pod, container, job, agent"
        action: upsert

exporters:
  loki:
    endpoint: "http://loki:3100/loki/api/v1/push"

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [batch, resource]
      exporters: [loki]
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
    static_configs:
      - targets:
          - localhost
        labels:
          job: kubernetes-pods
          agent: promtail
          __path__: /var/log/pods/*/*/*.log
    pipeline_stages:
      - docker: {}
      - regex:
          source: filename
          expression: "^/var/log/pods/(?P<namespace>[^_]+)_(?P<pod>[^_]+)_(?P<uid>[a-z0-9-]+)/(?P<container>[^/]+)/.*"
      - labels:
          namespace:
          pod:
          container:
      - template:
          source: instance
          template: '{{ .pod }}'
      - labels:
          instance:
"""

def get_loki_manifests(namespace="logging"):
    """Returns manifests for Loki (Deployment, Service, PVC, ConfigMap)."""
    return [
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "loki-config", "namespace": namespace},
            "data": {"loki.yaml": DEFAULT_LOKI_CONFIG}
        },
        get_pvc_manifest("loki-storage", namespace, "5Gi"),
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

def get_otel_collector_manifests(namespace="logging"):
    """Returns manifests for OTel Collector (DaemonSet, RBAC, ConfigMap)."""
    return [
        {
            "apiVersion": "v1",
            "kind": "ServiceAccount",
            "metadata": {"name": "otel-collector", "namespace": namespace}
        },
        {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRole",
            "metadata": {"name": "otel-collector-role"},
            "rules": [{"apiGroups": [""], "resources": ["pods", "namespaces", "nodes"], "verbs": ["get", "list", "watch"]}]
        },
        {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRoleBinding",
            "metadata": {"name": "otel-collector-binding"},
            "subjects": [{"kind": "ServiceAccount", "name": "otel-collector", "namespace": namespace}],
            "roleRef": {"kind": "ClusterRole", "name": "otel-collector-role", "apiGroup": "rbac.authorization.k8s.io"}
        },
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "otel-collector-config", "namespace": namespace},
            "data": {"otel-collector-config.yaml": DEFAULT_OTEL_COLLECTOR_CONFIG}
        },
        {
            "apiVersion": "apps/v1",
            "kind": "DaemonSet",
            "metadata": {"name": "otel-collector", "namespace": namespace},
            "spec": {
                "selector": {"matchLabels": {"app": "otel-collector"}},
                "template": {
                    "metadata": {"labels": {"app": "otel-collector"}},
                    "spec": {
                        "serviceAccountName": "otel-collector",
                        "containers": [
                            {
                                "name": "otel-collector",
                                "image": "otel/opentelemetry-collector-contrib:0.91.0",
                                "args": ["--config=/etc/otelcol/otel-collector-config.yaml"],
                                "securityContext": {"runAsUser": 0, "privileged": True},
                                "volumeMounts": [
                                    {"name": "config", "mountPath": "/etc/otelcol"},
                                    {"name": "varlogpods", "mountPath": "/var/log/pods", "readOnly": True},
                                    {"name": "varlibdockercontainers", "mountPath": "/var/lib/docker/containers", "readOnly": True}
                                ]
                            }
                        ],
                        "volumes": [
                            {"name": "config", "configMap": {"name": "otel-collector-config"}},
                            {"name": "varlogpods", "hostPath": {"path": "/var/log/pods"}},
                            {"name": "varlibdockercontainers", "hostPath": {"path": "/var/lib/docker/containers"}}
                        ]
                    }
                }
            }
        }
    ]

def get_promtail_manifests(namespace="logging"):
    """Returns manifests for Promtail (DaemonSet, RBAC, ConfigMap)."""
    return [
        {"apiVersion": "v1", "kind": "ServiceAccount", "metadata": {"name": "promtail", "namespace": namespace}},
        {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRole",
            "metadata": {"name": "promtail-clusterrole"},
            "rules": [{"apiGroups": [""], "resources": ["nodes", "nodes/proxy", "services", "endpoints", "pods"], "verbs": ["get", "watch", "list"]}]
        },
        {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRoleBinding",
            "metadata": {"name": "promtail-clusterrolebinding"},
            "subjects": [{"kind": "ServiceAccount", "name": "promtail", "namespace": namespace}],
            "roleRef": {"kind": "ClusterRole", "name": "promtail-clusterrole", "apiGroup": "rbac.authorization.k8s.io"}
        },
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "promtail-config", "namespace": namespace},
            "data": {"promtail.yaml": DEFAULT_PROMTAIL_CONFIG}
        },
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
                        "securityContext": {"runAsUser": 0, "runAsGroup": 0},
                        "containers": [
                            {
                                "name": "promtail",
                                "image": "grafana/promtail:2.9.2",
                                "args": ["-config.file=/etc/promtail/promtail.yaml"],
                                "volumeMounts": [
                                    {"name": "config", "mountPath": "/etc/promtail"},
                                    {"name": "run", "mountPath": "/run/promtail"},
                                    {"name": "containers", "mountPath": "/var/lib/docker/containers", "readOnly": True, "mountPropagation": "HostToContainer"},
                                    {"name": "pods", "mountPath": "/var/log/pods", "readOnly": True, "mountPropagation": "HostToContainer"}
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
