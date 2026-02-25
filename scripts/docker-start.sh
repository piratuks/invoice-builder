set -e

echo "Starting container with SERVICE=${SERVICE}"

# Wait until the backend TCP port is accepting connections.
# Uses node (always available) because BusyBox nc does not support -z.
wait_for_backend() {
  local host="${1:-localhost}"
  local port="${2:-3000}"
  echo "Waiting for backend at ${host}:${port}..."
  for i in $(seq 1 30); do
    if node -e "
      const net = require('net');
      const c = net.createConnection($port, '$host');
      c.on('connect', () => { c.destroy(); process.exit(0); });
      c.on('error',   () => process.exit(1));
    " 2>/dev/null; then
      echo "Backend is ready."
      return 0
    fi
    sleep 1
  done
  echo "ERROR: backend did not become ready in 30 seconds" >&2
  exit 1
}

case "$SERVICE" in
  backend)
    mkdir -p /data
    echo "Starting backend webserver..."
    exec node /app/dist-be/backend/server/webserver/main.js
    ;;

  frontend)
    echo "Starting frontend (nginx) server..."
    wait_for_backend "${BACKEND_HOST:-localhost}" "${BACKEND_PORT:-3000}"
    export BACKEND_HOST="${BACKEND_HOST:-localhost}"
    export BACKEND_PORT="${BACKEND_PORT:-3000}"
    envsubst '${BACKEND_HOST} ${BACKEND_PORT}' \
      < /app/scripts/nginx.conf.template \
      > /etc/nginx/http.d/default.conf
    exec nginx -g 'daemon off;'
    ;;

  all)
    mkdir -p /data
    echo "Starting backend and frontend in single container..."
    node /app/dist-be/backend/server/webserver/main.js &
    BACKEND_PID=$!
    wait_for_backend localhost "${BACKEND_PORT:-3000}"
    export BACKEND_HOST=localhost
    export BACKEND_PORT="${BACKEND_PORT:-3000}"
    envsubst '${BACKEND_HOST} ${BACKEND_PORT}' \
      < /app/scripts/nginx.conf.template \
      > /etc/nginx/http.d/default.conf
    nginx -g 'daemon off;' &
    NGINX_PID=$!
    # Forward SIGTERM/SIGINT to both child processes
    trap "kill $BACKEND_PID $NGINX_PID 2>/dev/null" TERM INT
    # Exit as soon as either process exits
    wait $BACKEND_PID $NGINX_PID
    ;;

  *)
    echo "ERROR: SERVICE must be 'backend', 'frontend', or 'all'"
    exit 1
    ;;
esac
