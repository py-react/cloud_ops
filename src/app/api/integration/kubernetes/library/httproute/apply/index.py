"""
POST /api/integration/kubernetes/library/httproute/apply
Apply a derived HTTPRoute to the Kubernetes cluster.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from app.db_client.db import get_session
from app.db_client.models.kubernetes_profiles.httproute import K8sHTTPRoute
from src.app.api.integration.kubernetes.library.httproute.index import _build_httproute_manifest


async def POST(request: Request, id: int):
    """Build the manifest from DB profiles and apply it to the cluster."""
    from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
    with get_session() as session:
        route = session.get(K8sHTTPRoute, id)
        if not route:
            return JSONResponse(status_code=404, content={"detail": "HTTPRoute not found"})
        try:
            manifest = _build_httproute_manifest(session, route)
            k8s = KubernetesResourceHelper()
            k8s.apply_resource(manifest)
            return {"status": "success", "message": f"HTTPRoute '{route.name}' applied to cluster", "manifest": manifest}
        except Exception as e:
            return JSONResponse(status_code=500, content={"detail": str(e)})
