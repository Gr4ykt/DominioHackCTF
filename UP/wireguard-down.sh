#!/usr/bin/env bash
# Baja la interfaz wg0 (no borra la configuración ni las claves).
#   Uso:  bash UP/wireguard-down.sh
set -euo pipefail
WG_IF="wg0"
if ip link show "$WG_IF" >/dev/null 2>&1; then
  sudo wg-quick down "$WG_IF"
  echo "$WG_IF detenida."
else
  echo "$WG_IF no está activa."
fi
