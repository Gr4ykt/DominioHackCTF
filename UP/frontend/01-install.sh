#!/usr/bin/env bash
# =============================================================================
# UP/frontend/01-install.sh — Dependencias del servidor FRONTEND (Ubuntu 24.04).
# Node + pnpm (el frontend es Next.js en modo producción) + swap de 2G: el
# build de Next 16 en un t3.micro (1 GB) se queda sin memoria sin swap.
#   Uso:  bash UP/frontend/01-install.sh
# =============================================================================
set -euo pipefail

echo "==> Swap (2G) — el build de Next 16 no cabe en 1 GB"
if ! sudo swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

sudo apt-get update -qq
sudo apt-get install -y ca-certificates curl gnupg
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 22 ] 2>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
command -v pnpm >/dev/null || sudo npm install -g pnpm
echo "==> Node $(node -v) / pnpm $(pnpm -v) listos."
echo "    Siguiente: crea frontend/.env.production y corre bash UP/frontend/02-deploy.sh"
