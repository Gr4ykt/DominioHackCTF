#!/bin/bash
# Arranca MariaDB, carga el esquema del lab y luego Apache en primer plano.
# Contenedor efímero: la base se inicializa en cada arranque (sin persistencia).
set -e

DATADIR=/var/lib/mysql

# Directorio del socket de MariaDB (no siempre existe en la imagen base).
install -d -o mysql -g mysql /run/mysqld

# Inicializa el directorio de datos de MariaDB si está vacío.
if [ ! -d "$DATADIR/mysql" ]; then
  mariadb-install-db --user=mysql --datadir="$DATADIR" --auth-root-authentication-method=normal >/dev/null 2>&1
fi
chown -R mysql:mysql "$DATADIR"

# Arranca el servidor de base de datos en segundo plano.
mariadbd --user=mysql --datadir="$DATADIR" &
DB_PID=$!

# Espera a que MariaDB acepte conexiones.
for i in $(seq 1 30); do
  if mariadb-admin ping >/dev/null 2>&1; then break; fi
  sleep 1
done

# Carga el esquema y los datos del laboratorio.
mariadb < /opt/init.sql

# Cola de "mantenimiento": el panel admin (www-data) encola comandos aquí y el
# worker los ejecuta como root. Antipatrón deliberado del lab.
mkdir -p /var/www/maintenance
chown root:www-data /var/www/maintenance
chmod 770 /var/www/maintenance
/usr/local/bin/dh-worker.sh &

echo "VulneraWeb: base de datos lista. Iniciando Apache."

# Apache en primer plano (proceso principal del contenedor).
exec apache2-foreground
