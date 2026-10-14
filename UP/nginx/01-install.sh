#!/usr/bin/env bash
# =============================================================================
# UP/nginx/01-install.sh — Nginx + certbot en el servidor REVERSE PROXY.
#   Uso:  bash UP/nginx/01-install.sh
# =============================================================================
set -euo pipefail
sudo apt-get update -qq
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
echo "==> Nginx instalado. Siguiente:"
echo "   DOMAIN=tudominio.com BACKEND_IP=<priv> FRONTEND_IP=<priv> bash UP/nginx/02-config.sh"
