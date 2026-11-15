#!/usr/bin/env bash
set -euo pipefail

INGRESS_URL="${ODIN_INGRESS_URL:-}"
TENANT_TOKEN="${ODIN_TENANT_TOKEN:-}"
SERVICE_ENV="${ODIN_ENVIRONMENT:-production}"

if [[ -z "$INGRESS_URL" || -z "$TENANT_TOKEN" ]]; then
  echo "Error: ODIN_INGRESS_URL and ODIN_TENANT_TOKEN must be set." >&2
  exit 1
fi

docker events --filter 'event=die' --filter 'event=oom' --format '{{json .}}' | while read -r event; do
  container_id=$(echo "$event" | grep -o '"id":"[^"]*' | cut -d'"' -f4 || true)
  container_name=$(echo "$event" | grep -o '"name":"[^"]*' | cut -d'"' -f4 || true)
  action=$(echo "$event" | grep -o '"status":"[^"]*' | cut -d'"' -f4 || true)
  exit_code=$(echo "$event" | grep -o '"exitCode":"[^"]*' | cut -d'"' -f4 || true)

  if [[ -n "$container_id" ]]; then
    logs=$(docker logs --tail 60 "$container_id" 2>&1 | tr '\n' ' ' | sed 's/"/\\"/g' | cut -c1-8000 || true)
    
    payload=$(cat <<EOF
{
  "tenantToken": "$TENANT_TOKEN",
  "source": "docker",
  "environment": "$SERVICE_ENV",
  "service": "${container_name:-$container_id}",
  "event": "container_${action:-died}",
  "containerId": "$container_id",
  "exitCode": "${exit_code:-1}",
  "logs": "$logs"
}
EOF
)

    curl -s -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TENANT_TOKEN" \
      -d "$payload" \
      "$INGRESS_URL" > /dev/null || true
  fi
done
