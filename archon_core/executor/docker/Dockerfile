# ARCHON Compact Federation - Build Container
# Version: 2.5.1

FROM ubuntu:24.04

LABEL maintainer="ARCHON Federation <archon@selfarchitectai.com>"
LABEL version="2.5.1"
LABEL description="ARCHON AI Orchestration Build Container"

# Environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20
ENV PYTHON_VERSION=3.11
ENV R_VERSION=4.3

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Install Python
RUN add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y python${PYTHON_VERSION} python${PYTHON_VERSION}-pip python${PYTHON_VERSION}-venv \
    && update-alternatives --install /usr/bin/python3 python3 /usr/bin/python${PYTHON_VERSION} 1 \
    && update-alternatives --install /usr/bin/pip pip /usr/bin/pip${PYTHON_VERSION} 1

# Install R (optional, for R Intelligence Layer)
RUN apt-get install -y r-base r-base-dev

# Install Python dependencies
RUN pip install --break-system-packages \
    requests \
    pyyaml \
    pytest \
    sqlite-utils

# Create app directory
WORKDIR /app

# Copy project files
COPY . .

# Install Node dependencies if package.json exists
RUN if [ -f package.json ]; then npm ci || npm install; fi

# Expose port for telemetry endpoint
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Entry point
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
