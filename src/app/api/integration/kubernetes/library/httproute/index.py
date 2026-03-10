from fastapi import Request
from fastapi.responses import JSONResponse
from app.db_client.db import get_session
from app.db_client.models.kubernetes_profiles.httproute import K8sHTTPRoute
from app.db_client.controllers.kubernetes_profiles.httproute import (
    list_httproutes,
    create_httproute,
    update_httproute,
    delete_httproute
)
from app.utils.json_utils import clean_generic_profile
from typing import Optional
from sqlmodel import select

from app.db_client.models.kubernetes_profiles.httproute_metadata_profile import K8sHTTPRouteMetadataProfile
from app.db_client.models.kubernetes_profiles.httproute_hostnames_profile import K8sHTTPRouteHostnamesProfile
from app.db_client.models.kubernetes_profiles.httproute_rules_profile import K8sHTTPRouteRulesProfile
from app.db_client.models.kubernetes_profiles.httproute_parent_refs_profile import K8sHTTPRouteParentRefsProfile


def _build_httproute_manifest(session, route: K8sHTTPRoute) -> dict:
    """Compose a Kubernetes HTTPRoute manifest from the linked DB profiles."""
    meta_config = {}
    if route.metadata_profile_id:
        mp = session.get(K8sHTTPRouteMetadataProfile, route.metadata_profile_id)
        if mp:
            meta_config = mp.config or {}

    hostnames = []
    if route.hostnames_profile_id:
        hp = session.get(K8sHTTPRouteHostnamesProfile, route.hostnames_profile_id)
        if hp and hp.config:
            hostnames = hp.config if isinstance(hp.config, list) else hp.config.get("hostnames", [])

    parent_refs = []
    if route.parent_refs_profile_id:
        pp = session.get(K8sHTTPRouteParentRefsProfile, route.parent_refs_profile_id)
        if pp and pp.config:
            parent_refs = pp.config if isinstance(pp.config, list) else pp.config.get("parentRefs", [])

    rules = []
    if route.rules_profile_id:
        rp = session.get(K8sHTTPRouteRulesProfile, route.rules_profile_id)
        if rp and rp.config:
            rules = rp.config if isinstance(rp.config, list) else rp.config.get("rules", [])

    manifest = {
        "apiVersion": "gateway.networking.k8s.io/v1",
        "kind": "HTTPRoute",
        "metadata": {
            "name": route.name,
            "namespace": route.namespace,
            "labels": meta_config.get("labels", {}),
            "annotations": meta_config.get("annotations", {}),
        },
        "spec": {}
    }
    if parent_refs:
        manifest["spec"]["parentRefs"] = parent_refs
    if hostnames:
        manifest["spec"]["hostnames"] = hostnames
    if rules:
        manifest["spec"]["rules"] = rules

    return manifest

async def GET(request: Request, namespace: str):
    with get_session() as session:
        # We'll use a manual join strategy to include profile names/configs for the UI
        statement = select(K8sHTTPRoute).where(K8sHTTPRoute.namespace == namespace)
        routes = session.exec(statement).all()
        
        result = []
        for r in routes:
            rd = clean_generic_profile(r.dict())
            
            # Fetch Hostnames Profile details if linked
            rd["display_hostnames"] = "None"
            if r.hostnames_profile_id:
                hp = session.get(K8sHTTPRouteHostnamesProfile, r.hostnames_profile_id)
                if hp:
                    rd["hostnames_profile_name"] = hp.name
                    if hp.config:
                        h_list = hp.config if isinstance(hp.config, list) else hp.config.get("hostnames", [])
                        if isinstance(h_list, list) and len(h_list) > 0:
                            rd["display_hostnames"] = ", ".join(h_list)
                        else:
                            rd["display_hostnames"] = str(h_list)

            rd["config"] = {
                "metadata_profile": session.get(K8sHTTPRouteMetadataProfile, r.metadata_profile_id).dict() if r.metadata_profile_id else None,
                "hostnames_profile": session.get(K8sHTTPRouteHostnamesProfile, r.hostnames_profile_id).dict() if r.hostnames_profile_id else None,
                "rules_profile": session.get(K8sHTTPRouteRulesProfile, r.rules_profile_id).dict() if r.rules_profile_id else None,
                "parent_refs_profile": session.get(K8sHTTPRouteParentRefsProfile, r.parent_refs_profile_id).dict() if r.parent_refs_profile_id else None
            }

            # applied is not checked here — use the /status endpoint for on-demand cluster check
            rd["applied"] = None

            result.append(rd)
            
        return result

async def POST(request: Request, body: K8sHTTPRoute):
    with get_session() as session:
        spec = create_httproute(session, body)
        return spec.dict()

async def PUT(request: Request, id: int, body: K8sHTTPRoute):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        spec = update_httproute(session, id, data)
        if not spec:
            return JSONResponse(status_code=404, content={"detail": "HTTPRoute not found"})
        return spec.dict()

async def DELETE(request: Request, id: int):
    with get_session() as session:
        success = delete_httproute(session, id)
        if not success:
             return JSONResponse(status_code=404, content={"detail": "HTTPRoute not found"})
        return {"status": "success"}


async def APPLY(request: Request, id: int):
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
            return {"status": "success", "message": f"HTTPRoute '{route.name}' applied to cluster"}
        except Exception as e:
            return JSONResponse(status_code=500, content={"detail": str(e)})


async def DELETE_FROM_CLUSTER(request: Request, id: int):
    """Remove the HTTPRoute from the Kubernetes cluster (does not delete the DB record)."""
    from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
    with get_session() as session:
        route = session.get(K8sHTTPRoute, id)
        if not route:
            return JSONResponse(status_code=404, content={"detail": "HTTPRoute not found"})
        try:
            manifest = _build_httproute_manifest(session, route)
            k8s = KubernetesResourceHelper()
            k8s.delete_resource(manifest)
            return {"status": "success", "message": f"HTTPRoute '{route.name}' removed from cluster"}
        except Exception as e:
            return JSONResponse(status_code=500, content={"detail": str(e)})
