#!/usr/bin/env bash
# =============================================================================
# UP/frontend/setup.sh — Deja el servidor FRONTEND en producción de una vez.
#
# Orquesta:  01-install  ->  02-deploy   (t3.micro, Ubuntu 24.04).
#
# Requiere frontend/.env.production (NEXT_PUBLIC_API_URL se INCRUSTA en el build).
# Si no existe, instala dependencias y te dice qué crear.
#
#   Uso:  bash UP/frontend/setup.sh
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"

bash "$HERE/01-install.sh"

if [ -f "$REPO_ROOT/frontend/.env.production" ]; then
  bash "$HERE/02-deploy.sh"
else
  cat <<MSG

============================================================
 Falta frontend/.env.production. Créalo y vuelve a correr este comando:

   cp UP/frontend/frontend.env.production.example frontend/.env.production
   # edita NEXT_PUBLIC_API_URL -> https://<DOMINIO>/v1
============================================================
MSG
fi
