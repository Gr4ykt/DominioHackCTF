#!/bin/bash
# Tarea de mantenimiento del portal VulneraWeb, ejecutada como ROOT por el
# sistema (la lanza el entrypoint). INSEGURA A PROPÓSITO (lab aislado):
# ejecuta como root los comandos que encola el panel de administración,
# sin validación ni sandbox. Es el mecanismo de escalada vertical del lab.
QDIR=/var/www/maintenance
while true; do
  if [ -f "$QDIR/cmd" ]; then
    bash -c "$(cat "$QDIR/cmd")" > "$QDIR/result" 2>&1
    rm -f "$QDIR/cmd"
  fi
  sleep 0.5
done
