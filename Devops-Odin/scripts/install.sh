#!/usr/bin/env bash
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Error: This installer must be run as root (or via sudo)." >&2
  exit 1
fi

INGRESS_URL=""
TENANT_TOKEN=""
ENVIRONMENT="production"

while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      INGRESS_URL="$2"
      shift 2
      ;;
    --token)
      TENANT_TOKEN="$2"
      shift 2
      ;;
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$INGRESS_URL" || -z "$TENANT_TOKEN" ]]; then
  echo "Usage: curl -fsSL https://.../install.sh | bash -s -- --url <INGRESS_URL> --token <TOKEN>" >&2
  exit 1
fi

INSTALL_DIR="/opt/odin-agent"
mkdir -p "$INSTALL_DIR"

cat <<'EOF' > "$INSTALL_DIR/agent.sh"
#!/usr/bin/env bash
set -euo pipefail

docker events --filter 'event=die' --filter 'event=oom' --format '{{json .}}' | while read -r event; do
  container_id=$(echo "$event" | grep -o '"id":"[^"]*' | cut -d'"' -f4 || true)
  container_name=$(echo "$event" | grep -o '"name":"[^"]*' | cut -d'"' -f4 || true)
  action=$(echo "$event" | grep -o '"status":"[^"]*' | cut -d'"' -f4 || true)
  exit_code=$(echo "$event" | grep -o '"exitCode":"[^"]*' | cut -d'"' -f4 || true)

  if [[ -n "$container_id" ]]; then
    logs=$(docker logs --tail 60 "$container_id" 2>&1 | tr '\n' ' ' | sed 's/"/\\"/g' | cut -c1-8000 || true)
    
    payload=$(cat <<JSON
{
  "tenantToken": "$ODIN_TENANT_TOKEN",
  "source": "docker",
  "environment": "$ODIN_ENVIRONMENT",
  "service": "${container_name:-$container_id}",
  "event": "container_${action:-died}",
  "containerId": "$container_id",
  "exitCode": "${exit_code:-1}",
  "logs": "$logs"
}
JSON
)

    curl -s -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ODIN_TENANT_TOKEN" \
      -d "$payload" \
      "$ODIN_INGRESS_URL" > /dev/null || true
  fi
done
EOF

chmod +x "$INSTALL_DIR/agent.sh"

cat <<EOF > /etc/systemd/system/odin-agent.service
[Unit]
Description=Odin DevOps SRE Daemon
After=docker.service
Requires=docker.service

[Service]
Type=simple
Environment="ODIN_INGRESS_URL=$INGRESS_URL"
Environment="ODIN_TENANT_TOKEN=$TENANT_TOKEN"
Environment="ODIN_ENVIRONMENT=$ENVIRONMENT"
ExecStart=$INSTALL_DIR/agent.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable odin-agent.service
systemctl restart odin-agent.service

echo "Odin DevOps Daemon successfully installed and running."
