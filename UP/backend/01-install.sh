#!/usr/bin/env bash
# =============================================================================
# UP/backend/01-install.sh — Dependencias del servidor BACKEND (Ubuntu 24.04).
#
# Instala Docker Engine, Node + pnpm, wireguard-tools, iptables y gVisor
# (binario upstream) registrando el runtime `runsc` con --platform=systrap
# (las EC2 normales no tienen /dev/kvm). Ver docs/DESPLIEGUE_AWS.md §1 y §3.1.
#
#   Uso:  bash UP/backend/01-install.sh      (como tu usuario; pide sudo)
#
# Idempotente: se puede re-ejecutar sin romper nada.
# =============================================================================
set -euo pipefail

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

echo "==> gVisor (binario upstream de Google)"
if ! command -v runsc >/dev/null; then
  ARCH="$(uname -m)"
  URL="https://storage.googleapis.com/gvisor/releases/release/latest/${ARCH}"
  TMP="$(mktemp -d)"
  ( cd "$TMP"
    curl -fsSL -O "${URL}/runsc" -O "${URL}/runsc.sha512" \
         -O "${URL}/containerd-shim-runsc-v1" -O "${URL}/containerd-shim-runsc-v1.sha512"
    sha512sum -c runsc.sha512 -c containerd-shim-runsc-v1.sha512
    chmod a+rx runsc containerd-shim-runsc-v1
    sudo mv runsc containerd-shim-runsc-v1 /usr/local/bin/ )
  rm -rf "$TMP"
fi
runsc --version | head -1

echo "==> Registrando runsc en /etc/docker/daemon.json (--platform=systrap)"
# En producción SÍ se aplican límites de memoria/CPU: --ignore-cgroups=false.
sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{
  "runtimes": {
    "runsc": {
      "path": "/usr/local/bin/runsc",
      "runtimeArgs": ["--overlay2=none", "--platform=systrap", "--ignore-cgroups=false"]
    }
  }
}
JSON
sudo systemctl restart docker
docker info 2>/dev/null | grep -i runtimes || true

cat <<'SUMMARY'

============================================================
 Backend: dependencias instaladas.
 IMPORTANTE: tu usuario se agregó al grupo 'docker'. Cierra la
 sesión SSH y vuelve a entrar (o corre 'newgrp docker') para que
 docker funcione sin sudo.

 Siguiente:
   bash UP/backend/02-wireguard-server.sh   (con WG_SERVER_ENDPOINT)
============================================================
SUMMARY
