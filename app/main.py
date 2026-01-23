from fastapi import FastAPI, Request
import httpx
from starlette.responses import Response
from starlette.requests import Request
from starlette.middleware.cors import CORSMiddleware
import logging
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

    @app.on_event("shutdown")
    def shutdown_event():
        # Perform any necessary cleanup or logging here
        pass

