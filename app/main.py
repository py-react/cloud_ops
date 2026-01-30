import asyncio
import ssl
import websockets
from fastapi import FastAPI, Request, WebSocket
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

logger = logging.getLogger(__name__)


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


import requests
from starlette.concurrency import run_in_threadpool

async def cluster_proxy(request: Request, service: str, namespace: str, path: str = ""):
    """
    Proxy requests to Kubernetes monitoring services (Prometheus/Grafana).
    Handles authentication, URL construction, and content rewriting for assets.
    """
    try:
        config.load_config()
            
        configuration = client.Configuration.get_default_copy()
        api_server = configuration.host
        
        # Determine port - simplified for now (defaulting to 80 as per previous logic)
        service_port = 80
        
        # Construct K8s Proxy URL
        # Logic: /api/v1/namespaces/{namespace}/services/{service_name}:{port}/proxy/{path}
        
        # Ensure path starts with / if it exists
        if path:
            path = "/" + path.lstrip("/")
        else:
            path = "/"
            
        k8s_proxy_path = f"/api/v1/namespaces/{namespace}/services/{service}:{service_port}/proxy{path}"
        target_url = f"{api_server}{k8s_proxy_path}"
        
        # Prepare headers
        headers = dict(request.headers)
        headers.pop("Host", None)
        headers.pop("host", None)
        headers.pop("content-length", None)
        # Strip Origin/Referer to avoid Grafana "Origin not allowed" errors
        # This forces the backend to treat it as a direct request or rely on its own internal handling
        headers.pop("Origin", None)
        headers.pop("origin", None)
        headers.pop("Referer", None)
        headers.pop("referer", None)
        headers.pop("Cookie", None)
        headers.pop("cookie", None)
        headers.pop("Authorization", None)
        headers.pop("authorization", None)
        
        # Add K8s Auth headers
        if configuration.api_key:
            for key, value in configuration.api_key.items():
                headers[key] = value
        
        if configuration.api_key_prefix:
            for key, value in configuration.api_key_prefix.items():
                if key in headers:
                    headers[key] = f"{value} {headers[key]}"

        # Prepare certs/verify for requests to match registry_helper.py patterns
        verify_ssl = configuration.ssl_ca_cert or not configuration.verify_ssl
        cert = (configuration.cert_file, configuration.key_file) if configuration.cert_file else None
        
        # Read body if present
        body = await request.body()
        
        # Define sync request function to run in threadpool
        def make_request():
            return requests.request(
                method=request.method,
                url=target_url,
                headers=headers,
                data=body,
                params=request.query_params,
                verify=verify_ssl,
                cert=cert,
                timeout=30.0
            )

        # Forward the request using requests (sync) in a threadpool
        proxy_res = await run_in_threadpool(make_request)

        # Content Rewriting for Grafana/Web Assets
        # Strip the K8s proxy prefix from Location headers and text content
        # so browser sees /cluster/proxy/... and not /api/v1/namespaces/...
        
        k8s_prefix = f"/api/v1/namespaces/{namespace}/services/{service}:{service_port}/proxy"
        
        response_headers = dict(proxy_res.headers)
        
        # 1. Fix Location header
        if "Location" in response_headers:
            if k8s_prefix in response_headers["Location"]:
                response_headers["Location"] = response_headers["Location"].replace(k8s_prefix, "")
                
        # 2. Fix Content
        content = proxy_res.content
        content_type = response_headers.get("Content-Type", "")
        
        if any(x in content_type for x in ["text/html", "text/css", "javascript", "application/javascript", "application/json", "xml"]):
            try:
                prefix_bytes = k8s_prefix.encode('utf-8')
                if prefix_bytes in content:
                    content = content.replace(prefix_bytes, b"")
                    # Remove content-length as it changed
                    response_headers.pop("Content-Length", None)
                    response_headers.pop("content-length", None)
            except Exception as e:
                logger.warning(f"Failed to rewrite content: {e}")

        # Filter forbidden headers for response
        excluded_headers = {"content-encoding", "content-length", "transfer-encoding", "connection", "host"}
        final_headers = {k: v for k, v in response_headers.items() if k.lower() not in excluded_headers}

        return Response(
            content=content,
            status_code=proxy_res.status_code,
            headers=final_headers,
            media_type=content_type
        )

    except Exception as e:
        logger.error(f"Monitoring proxy error: {str(e)}")
        return Response(content=f"Proxy Error: {str(e)}", status_code=500)


async def cluster_websocket_proxy(websocket: WebSocket):
    """
    Proxy WebSocket requests to Kubernetes pods/services (e.g. Grafana Live).
    """
    await websocket.accept()
    
    service = websocket.path_params["service"]
    namespace = websocket.path_params["namespace"]
    path = websocket.path_params.get("path", "")
    
    try:
        config.load_config()
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
    origins = [
        "http://localhost:5001",  # Example: your client's origin
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_api_route("/api/docker/hub/{path:path}", methods=["GET"], endpoint=proxy)

    route = APIRoute(
        path="/cluster/proxy/{service}/{namespace}/{path:path}",
        endpoint=cluster_proxy,
        methods=["GET", "POST", "PUT", "DELETE"],
    )

    app.router.routes.append(route)
    
    # Add WebSocket Route
    app.add_websocket_route("/cluster/proxy/{service}/{namespace}/{path:path}", cluster_websocket_proxy)

    @app.on_event("shutdown")
    def shutdown_event():
        # Perform any necessary cleanup or logging here
        pass

