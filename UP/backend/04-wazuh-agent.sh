#!/usr/bin/env bash
# =============================================================================
# UP/backend/04-wazuh-agent.sh — Agente Wazuh en el BACKEND.
#
# Instala SOLO el agente, apuntando al manager (la EC2 de Wazuh) por su IP
# PRIVADA. El manager/indexer/dashboard viven en otra instancia (UP/wazuh).
# Si el manager está apagado, el agente encola y reintenta.
#
#   Uso:  WAZUH_MANAGER=<IP_PRIVADA_WAZUH> bash UP/backend/04-wazuh-agent.sh
#
# Opcional por ahora: puedes dejarlo para después de tener el SIEM arriba.
# =============================================================================
set -euo pipefail

: "${WAZUH_MANAGER:?Debes definir WAZUH_MANAGER=<IP_PRIVADA_DE_LA_EC2_WAZUH>}"
WAZUH_VERSION="${WAZUH_VERSION:-4.9}"

if command -v wazuh-control >/dev/null || dpkg -s wazuh-agent >/dev/null 2>&1; then
  echo "==> wazuh-agent ya instalado; actualizando manager a $WAZUH_MANAGER"
  sudo sed -i "s#<address>.*</address>#<address>${WAZUH_MANAGER}</address>#" \
    /var/ossec/etc/ossec.conf || true
else
  echo "==> Repositorio e instalación de wazuh-agent $WAZUH_VERSION"
  curl -fsSL https://packages.wazuh.com/key/GPG-KEY-WAZUH | \
    sudo gpg --no-tty --batch --yes --dearmor -o /usr/share/keyrings/wazuh.gpg
  echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/${WAZUH_VERSION}/apt/ stable main" | \
    sudo tee /etc/apt/sources.list.d/wazuh.list >/dev/null
  sudo apt-get update -qq
  sudo WAZUH_MANAGER="$WAZUH_MANAGER" apt-get install -y wazuh-agent
fi

sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-agent

cat <<SUMMARY

============================================================
 Agente Wazuh instalado y apuntando a $WAZUH_MANAGER (1514/1515 TCP).
 Verifica en el dashboard del SIEM que aparece como 'Active'.
 (Cuando el servicio de eventos escriba su JSON por línea — DECISIONES D6 —
  añade esa ruta como <localfile> en /var/ossec/etc/ossec.conf.)
============================================================
SUMMARY
