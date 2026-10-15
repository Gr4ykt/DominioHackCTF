#!/usr/bin/env bash
# =============================================================================
# UP/backend/01-install.sh — Dependencias del servidor BACKEND (Ubuntu 24.04).
#
# Instala Docker Engine, Node + pnpm, wireguard-tools, iptables y gVisor
# (binario upstream, runtime `runsc` con --platform=systrap porque las EC2
# normales no tienen /dev/kvm). Crea swap de 2G: el t3.small (2 GB) se queda
# corto al compilar y al levantar labs. MongoDB es externo (Atlas M0).
#
#   Uso:  bash UP/backend/01-install.sh      (como tu usuario; pide sudo)
#
# Idempotente: se puede re-ejecutar sin romper nada.
# =============================================================================
set -euo pipefail

echo "==> Swap (2G) — evita OOM al compilar/levantar labs en instancias chicas"
if ! sudo swapon --show | grep -q '/swapfile'; then
  sudo fallocate -l 2G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo "==> apt: utilidades base"
sudo apt-get update -qq
sudo apt-get install -y ca-certificates curl gnupg wireguard-tools iptables

echo "==> Docker Engine"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$(id -un)" || true

echo "==> Node 22 + pnpm"
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 22 ] 2>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
command -v pnpm >/dev/null || sudo npm install -g pnpm

echo "==> gVisor (repo apt oficial de Google — upstream, NO el paquete de la distro)"
# gVisor pasó a instalarse por su repo apt (antes eran binarios sueltos; ahora
# runsc viene acompañado de binarios de apoyo, así que el paquete lo resuelve bien).
if ! command -v runsc >/dev/null; then
  sudo apt-get install -y apt-transport-https
  curl -fsSL https://gvisor.dev/archive.key | \
    sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" | \
    sudo tee /etc/apt/sources.list.d/gvisor.list >/dev/null
  sudo apt-get update -qq
  sudo apt-get install -y runsc
fi
runsc --version | head -1

echo "==> Registrando runsc en /etc/docker/daemon.json (--platform=systrap)"
# En producción SÍ se aplican límites de memoria/CPU: --ignore-cgroups=false.
RUNSC_PATH="$(command -v runsc)"
sudo tee /etc/docker/daemon.json >/dev/null <<JSON
{
  "runtimes": {
    "runsc": {
      "path": "$RUNSC_PATH",
      "runtimeArgs": ["--overlay2=none", "--platform=systrap", "--ignore-cgroups=false"]
    }
  }
}
JSON
sudo systemctl restart docker
docker info 2>/dev/null | grep -i runtimes || true

cat <<'SUMMARY'

============================================================
 Backend: dependencias instaladas (Docker, Node, pnpm, gVisor, swap).
 IMPORTANTE: tu usuario se agregó al grupo 'docker'. Cierra la
 sesión SSH y vuelve a entrar (o corre 'newgrp docker') para que
 docker funcione sin sudo. El servicio systemd del backend sí toma
 el grupo al arrancar, aunque no reinicies la sesión.

 Siguiente:
   WG_SERVER_ENDPOINT=<ELASTIC_IP>:51820 bash UP/backend/02-wireguard-server.sh
============================================================
SUMMARY
