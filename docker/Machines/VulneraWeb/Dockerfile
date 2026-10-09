# VulneraWeb — Máquina vulnerable 1 de DominioHackCTF (dificultad Easy).
#
# ADVERTENCIA: imagen DELIBERADAMENTE vulnerable (SQLi, LFI, consola admin).
# Está pensada EXCLUSIVAMENTE para ejecutarse dentro del laboratorio aislado
# del motor (contenedor efímero bajo gVisor, en red bridge sin salida a
# internet ni acceso al host). NO exponer en una red real ni usar fuera del lab.
#
# Un único contenedor: Apache + PHP + MariaDB (modelo "llegar y levantar").

FROM php:8.2-apache

# Apache + PHP vienen listos; se agrega MariaDB y el driver mysqli.
RUN apt-get update \
    && apt-get install -y --no-install-recommends mariadb-server \
    && docker-php-ext-install mysqli >/dev/null \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Ajuste de MariaDB para que InnoDB arranque bajo gVisor (ver HALLAZGOS H-03).
COPY config/no-native-aio.cnf /etc/mysql/mariadb.conf.d/99-no-native-aio.cnf

# Virtual host.
COPY config/apache-vulneraweb.conf /etc/apache2/sites-available/000-default.conf

# Código de la aplicación web vulnerable.
COPY src/ /var/www/html/

# Script de inicialización de la base de datos (lo ejecuta el entrypoint).
COPY db/init.sql /opt/init.sql

# Archivo "heredado" con credenciales, objetivo de la LFI (legible por la web).
COPY config/credentials.conf /var/www/private/credentials.conf

# Flags estáticas:
#  - user.txt: legible por el usuario del servicio web (se obtiene vía LFI).
#  - root.txt: solo root (se obtiene tras la escalada por la consola admin).
COPY flags/user.txt /var/www/private/user.txt
COPY flags/root.txt /root/root.txt

# Mecanismo de escalada (deliberado): worker de mantenimiento que corre como root.
COPY scripts/dh-worker.sh /usr/local/bin/dh-worker.sh

COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/dh-worker.sh \
    && chown -R www-data:www-data /var/www \
    && chown root:www-data /var/www/private/user.txt /var/www/private/credentials.conf \
    && chmod 640 /var/www/private/user.txt /var/www/private/credentials.conf \
    && chmod 600 /root/root.txt

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
