#!/bin/bash
# ARCHON Build Container Entrypoint

echo "🏗️ ARCHON Build Container Starting..."
echo "Node: $(node --version)"
echo "Python: $(python3 --version)"
echo "R: $(R --version | head -1)"

# Run the build
if [ "$1" = "build" ]; then
    echo "Running build..."
    python3 /app/executor/run_build.py
elif [ "$1" = "test" ]; then
    echo "Running tests..."
    pytest /app/tests/ -v
elif [ "$1" = "serve" ]; then
    echo "Starting telemetry server..."
    python3 -m http.server 8080
else
    exec "$@"
fi
