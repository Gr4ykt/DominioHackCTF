#!/usr/bin/env bash
# =============================================================================
# UP/backend/03-sudoers.sh — Permite al backend ejecutar wg/iptables sin root.
#
# El backend corre como tu usuario (systemd User=). En modo cli necesita wg e
# iptables como root. Regla sudoers acotada a esos binarios con NOPASSWD.
#
#   Uso:  bash UP/backend/03-sudoers.sh
# =============================================================================
set -euo pipefail

TARGET_USER="${DHCTF_USER:-${SUDO_USER:-$(id -un)}}"
SUDOERS_FILE="/etc/sudoers.d/dhctf-backend"

WG_BIN="$(command -v wg || echo /usr/bin/wg)"
CMDS="$WG_BIN"
for p in /usr/sbin/iptables /sbin/iptables; do
  [ -e "$p" ] && CMDS="$CMDS, $p"
done

echo "==> Usuario del backend: $TARGET_USER"
echo "==> Comandos (NOPASSWD): $CMDS"

TMP="$(mktemp)"
printf '%s ALL=(root) NOPASSWD: %s\n' "$TARGET_USER" "$CMDS" > "$TMP"
if sudo visudo -cf "$TMP" >/dev/null; then
  sudo install -m 440 -o root -g root "$TMP" "$SUDOERS_FILE"
  rm -f "$TMP"
  echo "==> Instalado en $SUDOERS_FILE"
else
  rm -f "$TMP"
  echo "!! La regla no pasó visudo. No se instaló nada."; exit 1
fi
