#!/usr/bin/env bash
# =============================================================================
# UP/frontend/01-install.sh — Dependencias del servidor FRONTEND (Ubuntu 24.04).
# Solo Node + pnpm (el frontend es Next.js en modo producción).
#   Uso:  bash UP/frontend/01-install.sh
# =============================================================================
set -euo pipefail
sudo apt-get update -qq
sudo apt-get install -y ca-certificates curl gnupg
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 22 ] 2>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
command -v pnpm >/dev/null || sudo npm install -g pnpm
echo "==> Node $(node -v) / pnpm $(pnpm -v) listos."
echo "    Siguiente: crea frontend/.env.production y corre bash UP/frontend/02-deploy.sh"
