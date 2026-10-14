#!/usr/bin/env bash
# =============================================================================
# UP/wazuh/01-install.sh — Stack Wazuh (manager + indexer + dashboard) SIEM.
#
# Instalador oficial todo-en-uno. Instancia dedicada (t3.medium / 4 GB mín.).
# Al terminar imprime la URL del dashboard y la clave de 'admin': GUÁRDALAS.
#
#   Uso:  bash UP/wazuh/01-install.sh
#
# Red (ver docs/DESPLIEGUE_AWS.md §2): abre 1514/1515 SOLO desde el SG del
# backend y 443 SOLO desde tu IP. No lo expongas a internet.
# =============================================================================
set -euo pipefail

if [ -d /var/ossec ] && command -v /var/ossec/bin/wazuh-control >/dev/null 2>&1; then
  echo "==> Wazuh ya parece instalado en /var/ossec. Abortando para no duplicar."
  exit 0
fi

echo "==> Descargando instalador oficial de Wazuh"
curl -sO https://packages.wazuh.com/4.9/wazuh-install.sh
echo "==> Instalando (indexer + manager + dashboard). Puede tardar varios minutos."
sudo bash wazuh-install.sh -a -i

cat <<'SUMMARY'

============================================================
 Stack Wazuh instalado. El instalador imprimió arriba la URL del
 dashboard (https://<IP>:443) y la clave del usuario 'admin'.
 GUÁRDALAS. Credenciales completas en wazuh-install-files.tar.

 Siguiente: en el BACKEND instala el agente apuntando a la IP privada de ESTA EC2:
   WAZUH_MANAGER=<IP_PRIVADA_DE_ESTA_EC2> bash UP/backend/04-wazuh-agent.sh
============================================================
SUMMARY
