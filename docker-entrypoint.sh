#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────────
# docker-entrypoint.sh
#
# Remplace uniquement ${BACKEND_URL} dans le template Nginx avant de démarrer.
# Les variables Nginx natives ($host, $uri, $cookie_*, etc.) ne sont PAS
# substituées grâce au paramètre explicite passé à envsubst.
# ──────────────────────────────────────────────────────────────────────────────
set -e

: "${BACKEND_URL:=http://localhost:8080}"

echo "[entrypoint] BACKEND_URL = $BACKEND_URL"

envsubst '${BACKEND_URL}' \
  < /etc/nginx/templates/app.conf.template \
  > /etc/nginx/conf.d/app.conf

# Validation de la configuration Nginx générée
nginx -t

exec nginx -g "daemon off;"

