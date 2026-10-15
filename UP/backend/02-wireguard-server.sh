#!/usr/bin/env bash
# =============================================================================
# UP/backend/02-wireguard-server.sh — Servidor WireGuard en el BACKEND (prod).
#
# Igual que el script del host de pruebas, pero el ENDPOINT NO se autodetecta:
# en AWS la IP local es privada; el cliente necesita la Elastic IP pública.
# Debes pasar WG_SERVER_ENDPOINT. NO edita backend/.env (en prod lo escribes a
# mano con los secretos reales): imprime los valores para que los pegues.
#
#   Uso:  WG_SERVER_ENDPOINT=<ELASTIC_IP_BACKEND>:51820 bash UP/backend/02-wireguard-server.sh
#
# Idempotente: reutiliza las claves del servidor si ya existen.
# =============================================================================
set -euo pipefail

WG_IF="wg0"
WG_ADDR="10.10.0.1/24"
WG_PORT="51820"
WG_DIR="/etc/wireguard"

: "${WG_SERVER_ENDPOINT:?Debes definir WG_SERVER_ENDPOINT=<ELASTIC_IP>:51820}"

command -v wg >/dev/null || { sudo apt-get update -qq && sudo apt-get install -y wireguard-tools; }

echo "==> Claves del servidor"
sudo install -d -m 700 "$WG_DIR"
if ! sudo test -f "$WG_DIR/server.key"; then
  sudo sh -c "umask 077; wg genkey | tee '$WG_DIR/server.key' | wg pubkey > '$WG_DIR/server.pub'"
else
  echo "    reutilizando claves existentes"
fi
SERVER_PUB="$(sudo cat "$WG_DIR/server.pub")"
SERVER_PRIV="$(sudo cat "$WG_DIR/server.key")"

echo "==> Escribiendo $WG_DIR/$WG_IF.conf (solo [Interface]; los peers los agrega el backend)"
sudo tee "$WG_DIR/$WG_IF.conf" >/dev/null <<CONF
[Interface]
Address = $WG_ADDR
ListenPort = $WG_PORT
PrivateKey = $SERVER_PRIV
CONF
sudo chmod 600 "$WG_DIR/$WG_IF.conf"

echo "==> Reenvío de IP persistente"
echo 'net.ipv4.ip_forward = 1' | sudo tee /etc/sysctl.d/99-dhctf.conf >/dev/null
sudo sysctl -q -w net.ipv4.ip_forward=1

echo "==> Handshake WireGuard (UDP $WG_PORT) permitido en INPUT"
sudo iptables -C INPUT -p udp --dport "$WG_PORT" -j ACCEPT 2>/dev/null || \
  sudo iptables -I INPUT 1 -p udp --dport "$WG_PORT" -j ACCEPT

echo "==> Levantando $WG_IF"
if ip link show "$WG_IF" >/dev/null 2>&1; then
  echo "    $WG_IF ya activa (no se tocan los peers existentes)"
else
  sudo wg-quick up "$WG_IF"
fi

echo "==> Habilitando $WG_IF en el arranque (sobrevive apagar/encender la instancia)"
sudo systemctl enable "wg-quick@$WG_IF" >/dev/null 2>&1 || true

cat <<SUMMARY

============================================================
 Servidor WireGuard listo.
   Endpoint:  $WG_SERVER_ENDPOINT
   Clave pública del servidor:
     $SERVER_PUB

 Pega estos valores en backend/.env (modo producción):
   WG_MODE=cli
   FIREWALL_MODE=cli
   WG_SERVER_PUBLIC_KEY=$SERVER_PUB
   WG_SERVER_ENDPOINT=$WG_SERVER_ENDPOINT
   WG_USE_SUDO=true

 Siguiente:  bash UP/backend/03-sudoers.sh
============================================================
SUMMARY
