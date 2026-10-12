#!/usr/bin/env bash
# =============================================================================
# 02-backend-sudoers.sh — Permite al backend gestionar wg e iptables sin root.
#
# El backend (NestJS) corre como tu usuario, no como root. En modo cli necesita
# ejecutar `wg` e `iptables` como root. Este script crea una regla sudoers
# acotada a esos binarios, con NOPASSWD, para el usuario que ejecuta el backend.
#
#   Uso:  bash UP/02-backend-sudoers.sh        (pide sudo internamente)
#
# Nota de seguridad: se acota a los binarios wg/iptables (no a sudo genérico),
# pero con argumentos libres (el backend pasa claves/IPs dinámicas). Adecuado
# para el servidor de pruebas. En producción, evaluar CAP_NET_ADMIN.
# =============================================================================
set -euo pipefail

TARGET_USER="${SUDO_USER:-$(id -un)}"
SUDOERS_FILE="/etc/sudoers.d/dhctf-backend"

# Rutas reales de los binarios (pueden variar según la distro).
WG_BIN="$(command -v wg || echo /usr/bin/wg)"
CMDS="$WG_BIN"
for p in /usr/sbin/iptables /sbin/iptables; do
  [ -e "$p" ] && CMDS="$CMDS, $p"
done

echo "==> Usuario del backend: $TARGET_USER"
echo "==> Comandos permitidos (NOPASSWD): $CMDS"

TMP="$(mktemp)"
printf '%s ALL=(root) NOPASSWD: %s\n' "$TARGET_USER" "$CMDS" > "$TMP"

# Validar antes de instalar (regla inválida en sudoers puede bloquear sudo).
if sudo visudo -cf "$TMP" >/dev/null; then
  sudo install -m 440 -o root -g root "$TMP" "$SUDOERS_FILE"
  rm -f "$TMP"
  echo "==> Instalado en $SUDOERS_FILE"
  echo "    prueba:  sudo -n $WG_BIN --version"
else
  rm -f "$TMP"
  echo "!! La regla no pasó la validación de visudo. No se instaló nada."
  exit 1
fi
