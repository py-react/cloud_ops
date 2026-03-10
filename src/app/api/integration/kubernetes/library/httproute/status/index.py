"""
GET /api/integration/kubernetes/library/httproute/status
On-demand check: does this HTTPRoute exist on the Kubernetes cluster?

Returns: { "id": int, "name": str, "applied": bool }
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from app.db_client.db import get_session
from app.db_client.models.kubernetes_profiles.httproute import K8sHTTPRoute


async def GET(request: Request, id: int):
    with get_session() as session:
        route = session.get(K8sHTTPRoute, id)
        if not route:
            return JSONResponse(status_code=404, content={"detail": "HTTPRoute not found"})

        try:
            from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
            k8s = KubernetesResourceHelper()
            resource_client = k8s.dyn_client.resources.get(
                api_version="gateway.networking.k8s.io/v1", kind="HTTPRoute"
            )
            resource_client.get(name=route.name, namespace=route.namespace)
            applied = True
        except Exception:
            applied = False

        return {
            "id": route.id,
            "name": route.name,
            "namespace": route.namespace,
            "applied": applied,
        }
