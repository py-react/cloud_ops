# --- Stage 1: Builder ---
FROM python:3.12-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    python3-dev \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY requirements.txt package.json package-lock.json ./

# 1. Setup Virtual Env in /app/venv and install Python deps
# Creating it inside /app ensures Node's directory-traversal module
# resolution finds /app/node_modules when resolving imports from
# within package JS files.
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install kiwijs --force-reinstall

# 2. Install Node deps locally into /app/node_modules
#    Using `npm ci` for reproducible installs from package-lock.json
RUN npm ci


# --- Stage 2: Final Runtime ---
FROM python:3.12-slim

# Install ONLY the bare minimum runtime deps (Node runtime)
RUN apt-get update && apt-get install -y curl socat \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the Virtual Env from builder
COPY --from=builder /app/venv /app/venv
# Copy the locally-installed Node packages from builder
COPY --from=builder /app/node_modules /app/node_modules

# Set PATHs so the OS finds your Python and Node tools
ENV PATH="/app/venv/bin:/app/node_modules/.bin:$PATH"

# Copy application code
COPY . .

# Environment variables to ensure python uses the venv
ENV VIRTUAL_ENV=/app/venv
