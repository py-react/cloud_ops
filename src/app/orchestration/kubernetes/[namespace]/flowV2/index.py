from fastapi import Request

async def index(request: Request):
    # Available components for the drag-and-drop palette
    components = [
        {
            "type": "ingress",
            "label": "Ingress",
            "icon": "Globe2",
            "defaultData": {
                "ingress_name": "new-ingress",
                "host": "example.com",
                "paths": [],
                "belongs_to": "Networking"
            }
        },
        {
            "type": "service",
            "label": "Service",
            "icon": "Network",
            "defaultData": {
                "service_name": "new-service",
                "type": "ClusterIP",
                "clusterIP": "10.0.0.1",
                "ports": [{"port": 80, "targetPort": 8080, "protocol": "TCP"}],
                "belongs_to": "Networking"
            }
        },
        {
            "type": "deploymentV2",
            "label": "Deployment",
            "icon": "Layers",
            "defaultData": {
                "deployment_name": "new-deployment",
                "component_type": "deployment",
                "available_replicas": 0,
                "expected_replicas": 1,
                "pods": [],
                "belongs_to": "Workload"
            }
        },
        {
            "type": "pod",
            "label": "Pod",
            "icon": "Box",
            "defaultData": {
                "name": "new-pod",
                "component_type": "pod",
                "status": "Pending",
                "restarts": 0,
                "age": "0s",
                "ip": "N/A",
                "resources": {
                    "cpu": {"used": "0", "total": "1", "percentage": "0"},
                    "memory": {"used": "0Mi", "total": "128Mi", "percentage": "0"}
                },
                "belongs_to": "Compute"
            }
        }
    ]
    return {"availableComponents": components}
