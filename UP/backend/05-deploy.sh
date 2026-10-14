#!/usr/bin/env bash
# =============================================================================
# UP/backend/05-deploy.sh — Construye imágenes, migra, compila y arranca el API.
#
# Requisitos previos:
#   - 01-install.sh ejecutado (docker, node, pnpm, gVisor).
#   - 02-wireguard-server.sh y 03-sudoers.sh ejecutados.
#   - backend/.env creado con los secretos reales (ver UP/backend/backend.env.example).
#
#   Uso:  bash UP/backend/05-deploy.sh
#
# SEGURO EN PRODUCCIÓN: usa 'prisma migrate deploy' (NUNCA migrate dev/reset) y
# NO corre el seed de desarrollo. Toma un snapshot de RDS antes, por si acaso.
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND="$REPO_ROOT/backend"
SERVICE_USER="${DHCTF_USER:-$(id -un)}"

[ -f "$BACKEND/.env" ] || { echo "!! Falta $BACKEND/.env (ver UP/backend/backend.env.example)"; exit 1; }

echo "==> Construyendo imágenes de máquinas vulnerables"
for dir in "$REPO_ROOT"/docker/Machines/*/; do
  [ -f "$dir/Dockerfile" ] || [ -f "$dir/docker-compose.yml" ] || continue
  slug="$(basename "$dir" | tr '[:upper:]' '[:lower:]')"
  echo "    -> $slug"
  if [ -f "$dir/Dockerfile" ]; then
    docker build -t "$slug:latest" "$dir"
  fi
done

echo "==> Instalando dependencias (postinstall corre prisma generate)"
cd "$BACKEND"
pnpm install --frozen-lockfile

echo "==> Aplicando migraciones pendientes (sin perder datos)"
pnpm exec prisma migrate deploy

echo "==> Compilando"
pnpm build

echo "==> Instalando servicio systemd dhctf-backend"
sudo tee /etc/systemd/system/dhctf-backend.service >/dev/null <<UNIT
[Unit]
Description=DominioHackCTF Backend (NestJS)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$BACKEND
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now dhctf-backend
sleep 2
sudo systemctl --no-pager status dhctf-backend | head -8 || true

cat <<SUMMARY

============================================================
 Backend desplegado.
   Logs:     journalctl -u dhctf-backend -f
   Reinicio: sudo systemctl restart dhctf-backend
 Recuerda: el primer usuario que se registre será el SUPERUSUARIO.
============================================================
SUMMARY
