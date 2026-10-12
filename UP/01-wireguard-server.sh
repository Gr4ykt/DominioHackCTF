#!/usr/bin/env bash
# =============================================================================
# 01-wireguard-server.sh — Configura el servidor WireGuard de DominioHackCTF.
#
# Deja la interfaz wg0 (10.10.0.1/24, UDP 51820) lista para que el backend, en
# modo cli, agregue/quite peers dinámicamente. Actualiza backend/.env con la
# clave pública y el endpoint del servidor.
#
#   Uso:  bash UP/01-wireguard-server.sh          (NO con sudo; pide sudo solo donde hace falta)
#
# Idempotente: si ya existe la clave del servidor, la reutiliza (la clave
# pública no cambia entre ejecuciones).
# =============================================================================
set -euo pipefail

WG_IF="wg0"
WG_ADDR="10.10.0.1/24"
WG_PORT="51820"
WG_DIR="/etc/wireguard"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../backend/.env"

if [ "${EUID:-$(id -u)}" -eq 0 ]; then
  echo "!! Ejecuta este script como tu usuario normal (no con sudo):"
  echo "   bash UP/01-wireguard-server.sh"
  echo "   (así backend/.env no queda como root; el script pide sudo cuando lo necesita)"
  exit 1
fi

echo "==> Verificando WireGuard"
if ! command -v wg >/dev/null; then
  echo "    instalando wireguard-tools..."
  sudo apt-get update -qq && sudo apt-get install -y wireguard-tools
fi

echo "==> Detectando IP de red"
LAN_IP="$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')"
[ -z "$LAN_IP" ] && LAN_IP="127.0.0.1"
ENDPOINT="${LAN_IP}:${WG_PORT}"
echo "    endpoint: $ENDPOINT"

echo "==> Claves del servidor"
sudo install -d -m 700 "$WG_DIR"
if ! sudo test -f "$WG_DIR/server.key"; then
  sudo sh -c "umask 077; wg genkey | tee '$WG_DIR/server.key' | wg pubkey > '$WG_DIR/server.pub'"
  echo "    generadas nuevas claves del servidor"
else
  echo "    reutilizando claves existentes"
fi
SERVER_PUB="$(sudo cat "$WG_DIR/server.pub")"
SERVER_PRIV="$(sudo cat "$WG_DIR/server.key")"

echo "==> Escribiendo $WG_DIR/$WG_IF.conf"
# Solo [Interface]: los peers los agrega el backend dinámicamente (wg set).
sudo tee "$WG_DIR/$WG_IF.conf" >/dev/null <<CONF
[Interface]
Address = $WG_ADDR
ListenPort = $WG_PORT
PrivateKey = $SERVER_PRIV
CONF
sudo chmod 600 "$WG_DIR/$WG_IF.conf"

echo "==> Habilitando reenvío de IP (persistente)"
echo 'net.ipv4.ip_forward = 1' | sudo tee /etc/sysctl.d/99-dhctf.conf >/dev/null
sudo sysctl -q -w net.ipv4.ip_forward=1

echo "==> Permitiendo el handshake WireGuard (UDP $WG_PORT) en INPUT"
if ! sudo iptables -C INPUT -p udp --dport "$WG_PORT" -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 1 -p udp --dport "$WG_PORT" -j ACCEPT
fi

echo "==> Levantando $WG_IF"
if ip link show "$WG_IF" >/dev/null 2>&1; then
  # Ya activa: no se re-sincroniza para no borrar los peers que el backend
  # haya agregado dinámicamente. Si cambiaste la config, baja primero con
  # bash UP/wireguard-down.sh y vuelve a ejecutar este script.
  echo "    $WG_IF ya está activa (no se tocan los peers existentes)"
else
  sudo wg-quick up "$WG_IF"
fi

echo "==> Actualizando $ENV_FILE"
set_env() {
  local k="$1" v="$2"
  if grep -qE "^${k}=" "$ENV_FILE"; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$k" "$v" >> "$ENV_FILE"
  fi
}
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%s)"
  set_env WG_MODE cli
  set_env FIREWALL_MODE cli
  set_env WG_SERVER_PUBLIC_KEY "$SERVER_PUB"
  set_env WG_SERVER_ENDPOINT "$ENDPOINT"
  set_env WG_USE_SUDO true
  echo "    actualizado (respaldo en $ENV_FILE.bak.*)"
else
  echo "    (no se encontró backend/.env; configúralo a mano con los valores de abajo)"
fi

cat <<SUMMARY

============================================================
 Servidor WireGuard listo.
   Interfaz:  $WG_IF ($WG_ADDR)  ·  Puerto UDP: $WG_PORT
   Endpoint:  $ENDPOINT
   Clave pública del servidor:
     $SERVER_PUB

 Valores aplicados en backend/.env:
   WG_MODE=cli
   FIREWALL_MODE=cli
   WG_SERVER_PUBLIC_KEY=$SERVER_PUB
   WG_SERVER_ENDPOINT=$ENDPOINT
   WG_USE_SUDO=true

 SIGUIENTE:
   1) Ejecuta una vez:   bash UP/02-backend-sudoers.sh
   2) Reinicia el backend (lee .env al arrancar).
   3) Desde tu VM (en red puente), descarga el .conf e inicia la VPN.
      La VM debe poder alcanzar $LAN_IP por la red local.
============================================================
SUMMARY
