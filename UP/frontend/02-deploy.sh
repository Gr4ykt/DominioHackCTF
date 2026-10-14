#!/usr/bin/env bash
# =============================================================================
# UP/frontend/02-deploy.sh — Build de producción + servicio systemd del frontend.
#
# Requisito: frontend/.env.production con NEXT_PUBLIC_API_URL (se INCRUSTA en el
# build; si cambia, hay que reconstruir). Ver UP/frontend/frontend.env.production.example.
#
#   Uso:  bash UP/frontend/02-deploy.sh
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRONTEND="$REPO_ROOT/frontend"
SERVICE_USER="${DHCTF_USER:-$(id -un)}"

[ -f "$FRONTEND/.env.production" ] || { echo "!! Falta $FRONTEND/.env.production (ver UP/frontend/frontend.env.production.example)"; exit 1; }

cd "$FRONTEND"
echo "==> Instalando dependencias"
pnpm install --frozen-lockfile
echo "==> Build de producción (incrusta NEXT_PUBLIC_*)"
pnpm build

echo "==> Instalando servicio systemd dhctf-frontend"
sudo tee /etc/systemd/system/dhctf-frontend.service >/dev/null <<UNIT
[Unit]
Description=DominioHackCTF Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$FRONTEND
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now dhctf-frontend
sleep 2
sudo systemctl --no-pager status dhctf-frontend | head -8 || true
echo "==> Frontend arriba en :3000.  Logs: journalctl -u dhctf-frontend -f"
