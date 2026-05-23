import asyncio
import ssl
import websockets
from fastapi import FastAPI, Request, WebSocket, Response
from fastapi.responses import JSONResponse
from starlette.websockets import WebSocketDisconnect
import httpx
from starlette.responses import Response
from starlette.requests import Request
from starlette.middleware.cors import CORSMiddleware
import logging
from kubernetes import client, config
import os
import json
from fastapi.routing import APIRoute
from app.services.kube_config_service import KubeConfigService

logger = logging.getLogger(__name__)

# Configure logging to API_ROUTES.log
log_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "API_ROUTES.log")
handler = logging.FileHandler(log_file)
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)



# Define the target server for proxying requests
TARGET_URL = "https://registry.hub.docker.com"

async def proxy(path: str, request: Request, response: Response):
    """
    Proxy the GET request to Docker Hub registry without modifying the headers or body.
    """
    target_url = f"{TARGET_URL}/{path}"

    # Send the request to Docker Hub
    async with httpx.AsyncClient() as client:
        proxy = await client.get(target_url, params=request.query_params)

    # Set the body and status code in the response to match Docker Hub's response
    response.body = proxy.content
    response.status_code = proxy.status_code
    response.headers["Content-Type"] = "application/json"

    return response


import httpx

async def cluster_proxy(request: Request, service: str, namespace: str, path: str = "", service_port: int = 80, rewrite_v2_location: bool = True):
    """
    Proxy requests to Kubernetes services (Prometheus/Grafana/Registry).
    Uses intelligent port discovery: if port is 80 (default), it looks up the 
    actual service port in the Addon Registry.
    """
    try:
        # Intelligent Port Discovery: Look up the service in the registry to find its native port
        # This keeps the Apache and Proxy URLs generic while hitting the correct backend port.
        if service_port == 80:
            from app.db_client.db import get_session
            from app.db_client.models.addon_plugin.addon_plugin import AddonPlugin
            from sqlmodel import select
            
            with get_session() as session:
                plugin = session.exec(select(AddonPlugin).where(AddonPlugin.name == service)).first()
                if plugin and plugin.service_port:
                    service_port = plugin.service_port
                    logger.info(f"Intelligent Port Discovery: Using port {service_port} for service '{service}'")

        try:
            success = KubeConfigService.load_active_config()
            if not success:
                return Response(
                    content="No active Kubernetes configuration found. Please upload or activate a Kubeconfig in the Control Center.", 
                    status_code=403
                )
        except Exception as e:
            return Response(content=f"Configuration Error: {str(e)}", status_code=400)
            
        configuration = client.Configuration.get_default_copy()
        api_server = configuration.host
        
        if path:
            path = "/" + path.lstrip("/")
        else:
            path = "/"
            
        k8s_proxy_path = f"/api/v1/namespaces/{namespace}/services/{service}:{service_port}/proxy{path}"
        target_url = f"{api_server}{k8s_proxy_path}"
        
        # Prepare headers — strip hop-by-hop and sensitive headers
        headers = {}
        skip_headers = {
            "host", "content-length", "origin", "referer", "cookie",
            "authorization", "transfer-encoding", "connection"
        }
        for k, v in request.headers.items():
            if k.lower() not in skip_headers:
                headers[k] = v
        
        # Add K8s Bearer token auth
        if configuration.api_key:
            for key, value in configuration.api_key.items():
                prefix = (configuration.api_key_prefix or {}).get(key, "")
                headers[key] = f"{prefix} {value}".strip() if prefix else value
        
        # Build SSL context from kubeconfig
        ssl_context = None
        if configuration.ssl_ca_cert:
            import ssl as ssl_module
            ssl_context = ssl_module.create_default_context(cafile=configuration.ssl_ca_cert)
            if configuration.cert_file and configuration.key_file:
                ssl_context.load_cert_chain(
                    certfile=configuration.cert_file,
                    keyfile=configuration.key_file
                )
        elif not configuration.verify_ssl:
            ssl_context = False  # httpx: False = skip verification
        
        body = await request.body()
        
        # Use httpx async client — handles concurrent requests without blocking threads
        async with httpx.AsyncClient(
            verify=ssl_context if ssl_context is not None else True,
            timeout=httpx.Timeout(connect=10.0, read=60.0, write=60.0, pool=10.0),
            follow_redirects=False,
        ) as http_client:
            proxy_res = await http_client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body if body else None,
                params=dict(request.query_params),
            )
        
        k8s_prefix = f"/api/v1/namespaces/{namespace}/services/{service}:{service_port}/proxy"
        
        response_headers = dict(proxy_res.headers)
        
        # Fix Location header
        if "location" in response_headers:
            location = response_headers["location"]
            if "://" in location:
                from urllib.parse import urlparse
                parsed = urlparse(location)
                location = parsed.path
                if parsed.query:
                    location += f"?{parsed.query}"
            if k8s_prefix in location:
                location = location.replace(k8s_prefix, "")
            if rewrite_v2_location and "/v2/" in location and not location.startswith(f"/v2/{service}/{namespace}/"):
                if location.startswith("/v2/"):
                    location = location.replace("/v2/", f"/v2/{service}/{namespace}/", 1)
            response_headers["location"] = location
                
        # Fix content (rewrite K8s proxy prefix in text responses)
        content = proxy_res.content
        content_type = response_headers.get("content-type", "")
        
        if any(x in content_type for x in ["text/html", "text/css", "javascript", "application/json", "xml"]):
            try:
                prefix_bytes = k8s_prefix.encode('utf-8')
                if prefix_bytes in content:
                    content = content.replace(prefix_bytes, b"")
                    response_headers.pop("content-length", None)
            except Exception as e:
                logger.warning(f"Failed to rewrite content: {e}")

        # Strip hop-by-hop response headers
        excluded_headers = {"content-encoding", "transfer-encoding", "connection", "host"}
        if request.method != "HEAD":
            excluded_headers.add("content-length")
            
        final_headers = {k: v for k, v in response_headers.items() if k.lower() not in excluded_headers}
        if "/v2/" in target_url:
            final_headers["Docker-Distribution-API-Version"] = "registry/2.0"

        return Response(
            content=content,
            status_code=proxy_res.status_code,
            headers=final_headers,
            media_type=content_type
        )

    except Exception as e:
        logger.error(f"Monitoring/Registry proxy error: {str(e)}")
        return Response(content=f"Proxy Error: {str(e)}", status_code=500)




async def v2_proxy(request: Request, service: str, namespace: str, path: str = ""):
    """
    Specialized proxy for Docker Registry V2 API.
    Always uses port 5000 and the /v2 prefix.
    """
    logger.info(f"V2 Proxy Request: {request.method} {request.url} -> {service}/{namespace}/{path}")
    if path:
        full_path = "/v2/" + path.lstrip("/")
    else:
        full_path = "/v2/"
    
    return await cluster_proxy(request, service, namespace, full_path, service_port=5000)

async def v2_root(request: Request):
    """
    Handle Docker's initial 'GET /v2/' check.
    """
    logger.info("V2 Root Check")
    headers = {
        "Docker-Distribution-API-Version": "registry/2.0",
        "X-Content-Type-Options": "nosniff"
    }
    return Response(content="{}", status_code=200, headers=headers, media_type="application/json")


async def cluster_websocket_proxy(websocket: WebSocket):
    """
    Proxy WebSocket requests to Kubernetes pods/services (e.g. Grafana Live).
    """
    await websocket.accept()
    
    service = websocket.path_params["service"]
    namespace = websocket.path_params["namespace"]
    path = websocket.path_params.get("path", "")
    
    try:
        try:
            success = KubeConfigService.load_active_config()
            if not success:
                logger.warning("WebSocket Proxy: No active Kubeconfig found.")
                await websocket.close(code=1008, reason="No active Kubernetes configuration")
                return
        except Exception as e:
            logger.error(f"WebSocket Proxy Config Error: {e}")
            await websocket.close(code=1008, reason=str(e))
            return

        configuration = client.Configuration.get_default_copy()
        api_server = configuration.host.replace("https://", "wss://").replace("http://", "ws://")
        
        service_port = 80
        
        # Ensure path starts with /
        if path:
            path = "/" + path.lstrip("/")
        else:
            path = "/"
            
        k8s_proxy_path = f"/api/v1/namespaces/{namespace}/services/{service}:{service_port}/proxy{path}"
        target_url = f"{api_server}{k8s_proxy_path}"
        
        # Prepare Headers
        headers = dict(websocket.headers)
        headers.pop("Host", None)
        headers.pop("host", None)
        headers.pop("Origin", None) 
        headers.pop("origin", None)
        headers.pop("Sec-WebSocket-Extensions", None) # Avoid negotiation issues
        
        # Add K8s Auth headers
        if configuration.api_key:
            for key, value in configuration.api_key.items():
                headers[key] = value
        
        if configuration.api_key_prefix:
            for key, value in configuration.api_key_prefix.items():
                if key in headers:
                    headers[key] = f"{value} {headers[key]}"

        # Prepare SSL Context
        ssl_context = ssl.create_default_context()
        if configuration.ssl_ca_cert:
            ssl_context.load_verify_locations(cafile=configuration.ssl_ca_cert)
        
        if configuration.cert_file and configuration.key_file:
            ssl_context.load_cert_chain(certfile=configuration.cert_file, keyfile=configuration.key_file)
            
        if not configuration.verify_ssl:
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE

        # Connect to Upstream
        # Websockets 14.0+ renamed extra_headers to additional_headers
        async with websockets.connect(target_url, ssl=ssl_context, additional_headers=headers) as upstream_ws:
            
            async def forward_client_to_upstream():
                try:
                    while True:
                        data = await websocket.receive_text()
                        await upstream_ws.send(data)
                except WebSocketDisconnect:
                    pass
                except Exception as e:
                    logger.error(f"WS Client->Upstream error: {e}")

            async def forward_upstream_to_client():
                try:
                    while True:
                        data = await upstream_ws.recv()
                        # Grafana Live might send binary/text, starlette handle send_text/send_bytes
                        await websocket.send_text(data) 
                except Exception as e:
                    logger.error(f"WS Upstream->Client error: {e}")

            # Run both forwards concurrently
            await asyncio.gather(
                forward_client_to_upstream(),
                forward_upstream_to_client(),
                return_exceptions=True
            )
            
    except Exception as e:
        logger.error(f"WebSocket Proxy Error: {e}")
        await websocket.close(code=1011)




# Function to extend the app by adding routes (following your exact pattern)
def extend_app(app: FastAPI):
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        """Global handler for configuration and validation errors"""
        error_msg = str(exc)
        is_k8s_error = any(keyword in error_msg for keyword in ["Kubernetes", "Kubeconfig", "context", "active configuration"])
        
        return JSONResponse(
            status_code=403 if is_k8s_error else 400,
            content={
                "error": error_msg,
                "type": "configuration_error" if is_k8s_error else "validation_error",
                "instruction": "Please visit the Kubeconfig Management page to set up your cluster connection." if is_k8s_error else None,
                "is_active_config_missing": is_k8s_error
            }
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Global fallback handler for unhandled exceptions (e.g., DB connection failures)"""
        logger.error(f"Global Exception: {str(exc)}", exc_info=True)
        
        # Check if it's likely a DB error
        error_msg = str(exc).lower()
        is_db_error = any(kw in error_msg for kw in ["connection", "psycopg", "database", "dial-up", "unreachable"])
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error" if not is_db_error else "Infrastructure/Database Connection Error",
                "message": str(exc) if is_db_error else "An unexpected error occurred. Please check the logs.",
                "type": "database_error" if is_db_error else "unhandled_exception",
                "is_infrastructure_down": is_db_error
            }
        )


    origins = [
        "http://localhost:5001",
        "http://127.0.0.1:5001",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5001",
            "http://127.0.0.1:5001",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_api_route("/api/docker/hub/{path:path}", methods=["GET"], endpoint=proxy)

    route = APIRoute(
        path="/cluster/proxy/{service}/{namespace}/{path:path}",
        endpoint=cluster_proxy,
        methods=["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH"],
    )

    app.router.routes.append(route)

    v2_route = APIRoute(
        path="/v2/{service}/{namespace}/{path:path}",
        endpoint=v2_proxy,
        methods=["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH"],
    )
    
    app.router.routes.append(v2_route)

    v2_root_route = APIRoute(
        path="/v2/",
        endpoint=v2_root,
        methods=["GET"],
    )
    app.router.routes.append(v2_root_route)
    
    # Add WebSocket Routes
    app.add_websocket_route("/cluster/proxy/{service}/{namespace}/{path:path}", cluster_websocket_proxy)
    

async def startup(app: FastAPI):
    # Database system seeding (after schema sync)
    try:
        from app.db_client.db import create_db_and_tables, ensure_default_essential_addons, ensure_default_strategies
        # Ensure tables exist (crucial for SQLite)
        create_db_and_tables()
        
        ensure_default_strategies(force=False)

        # Seed essentials (fetches helm values in user env) - force=True updates existing broken system values
        ensure_default_essential_addons(force=False)
    except Exception as e:
        logger.error(f"Startup Seeding Error: {e}. Platform may be in a limited state if database is unreachable.")

    # Clean up expired sessions on startup
    try:
        from app.utils.session_manager import clean_expired_sessions
        clean_expired_sessions()
    except Exception as e:
        logger.warning(f"Session cleanup error: {e}")

    try:
        from app.github_client.poller import get_polling_manager
        manager = get_polling_manager()
        # Initialize and sync pollers in the background
        asyncio.create_task(manager.sync_pollers())
    except Exception as e:
        logger.error(f"Poller Startup Error: {e}")


async def shutdown(app: FastAPI):
    from app.github_client.poller import get_polling_manager
    manager = get_polling_manager()
    manager.stop_all()


