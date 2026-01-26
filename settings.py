import os

NAME="app"
VERSION="1.0"
PACKAGE_MANAGER="npm"
DEBUG=True
PORT="5001"
HOST="0.0.0.0"
PYTHONDONTWRITEBYTECODE=""
CWD=os.path.dirname(os.path.abspath(__file__))
STATIC_SITE=False
TYPESCRIPT=True
TAILWIND=True
KUBECONFIG="~/.kube/config"
REGISTRY_HOST="registry.docker.localhome.com"
LOG_LEVEL="DEBUG"
UVICORN_WORKERS="1"
GITHUB_PAT_ENCRYPTION_KEY = os.getenv("GITHUB_PAT_ENCRYPTION_KEY", "")
SCM_POLLING_ENABLED="false"
SCM_POLL_INTERVAL_SECONDS="300"
PAT = os.getenv("PAT", "")

# Optional: Multi-registry configuration (supports fallback)
# If set, takes precedence over REGISTRY_HOST
# REGISTRY_CONFIGS = '[{"url":"registry.docker.localhome.com","priority":1},{"url":"backup-registry.aws.io","priority":2}]'

# Optional: Docker configuration
# DOCKER_MAX_IMAGE_AGE_HOURS = "24"
# DOCKER_BUILD_TIMEOUT_SECONDS = "600"
# DOCKER_MAX_CONCURRENT_BUILDS = "5"