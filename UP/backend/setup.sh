#!/usr/bin/env bash
# =============================================================================
# UP/backend/setup.sh — Deja el servidor BACKEND en producción de una sola vez.
#
# Orquesta, en orden, los pasos del backend (t3.small, Ubuntu 24.04):
#   01-install  ->  02-wireguard-server  ->  03-sudoers  ->  04-deploy
#
# Es un flujo en DOS fases porque backend/.env necesita dos datos que recién
# existen tras el paso 02 (la clave pública de WireGuard) y que configuras tú
# (el endpoint de RDS Aurora):
#
#   Fase 1:  WG_SERVER_ENDPOINT=<ELASTIC_IP>:51820 bash UP/backend/setup.sh
#            -> corre 01..03 e imprime la clave pública del servidor WireGuard.
#   Entremedio: crea backend/.env (copia UP/backend/backend.env.example y
#               rellena DATABASE_URL de RDS, JWT_SECRET, WG_SERVER_PUBLIC_KEY, etc.).
#   Fase 2:  WG_SERVER_ENDPOINT=<ELASTIC_IP>:51820 bash UP/backend/setup.sh
#            -> detecta backend/.env y corre 04-deploy.
#
# Idempotente: re-ejecutarlo no rompe nada.
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"

: "${WG_SERVER_ENDPOINT:?Define WG_SERVER_ENDPOINT=<ELASTIC_IP_BACKEND>:51820}"

bash "$HERE/01-install.sh"
bash "$HERE/02-wireguard-server.sh"
bash "$HERE/03-sudoers.sh"

if [ -f "$REPO_ROOT/backend/.env" ]; then
  echo "==> backend/.env encontrado: desplegando el API"
  bash "$HERE/04-deploy.sh"
else
  cat <<MSG

============================================================
 Falta backend/.env — FASE 1 completa.
 Crea el archivo de entorno con los secretos reales:

   cp UP/backend/backend.env.example backend/.env
   # edita backend/.env:
   #   DATABASE_URL        -> endpoint de RDS Aurora
   #   JWT_SECRET          -> openssl rand -hex 32
   #   WG_SERVER_PUBLIC_KEY-> la clave que imprimió el paso 02 (arriba)
   #   CORS_ORIGIN/FRONTEND_URL/COOKIE_DOMAIN -> tu dominio
   #   GOOGLE_* -> opcional

 Luego vuelve a correr este mismo comando para la fase 2 (deploy).
============================================================
MSG
fi
