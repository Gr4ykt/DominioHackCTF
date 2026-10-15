#!/usr/bin/env bash
# =============================================================================
# UP/nginx/setup.sh — Deja el servidor NGINX (reverse proxy + TLS) de una vez.
#
# Orquesta:  01-install  ->  02-config   (t3.micro, Ubuntu 24.04).
# El DNS de tu dominio debe apuntar YA a la IP pública de este servidor para
# que certbot pueda emitir el certificado.
#
#   Uso:  DOMAIN=dominiohackctf.cl \
#         BACKEND_IP=<IP_PRIVADA_BACKEND> \
#         FRONTEND_IP=<IP_PRIVADA_FRONTEND> \
#         bash UP/nginx/setup.sh
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

: "${DOMAIN:?Define DOMAIN=dominiohackctf.cl}"
: "${BACKEND_IP:?Define BACKEND_IP=<IP privada del backend>}"
: "${FRONTEND_IP:?Define FRONTEND_IP=<IP privada del frontend>}"

bash "$HERE/01-install.sh"
bash "$HERE/02-config.sh"
