#!/usr/bin/env bash
# =============================================================================
# UP/nginx/02-config.sh — Escribe el vhost (un dominio: / → front, /v1 → back),
# lo habilita y lanza certbot para el TLS.
#
#   Uso:  DOMAIN=dominiohackctf.cl BACKEND_IP=<IP_PRIVADA_BACKEND> \
#         FRONTEND_IP=<IP_PRIVADA_FRONTEND> bash UP/nginx/02-config.sh
# =============================================================================
set -euo pipefail

: "${DOMAIN:?Define DOMAIN=dominiohackctf.cl}"
: "${BACKEND_IP:?Define BACKEND_IP=<IP privada del backend>}"
: "${FRONTEND_IP:?Define FRONTEND_IP=<IP privada del frontend>}"

SITE="/etc/nginx/sites-available/dominiohackctf"
echo "==> Escribiendo $SITE (HTTP; el TLS y HTTP/2 los agrega certbot)"
# Se escribe SOLO el bloque en el puerto 80 con los proxys. certbot --nginx le
# agrega el 443 ssl, el certificado, HTTP/2 y la redirección a HTTPS. Así se
# evita el error "no ssl_certificate" (aún no existe el cert) y el de "http2"
# (nginx 1.24 de Ubuntu 24.04 no acepta la directiva `http2 on;`).
sudo tee "$SITE" >/dev/null <<CONF
limit_req_zone \$binary_remote_addr zone=api:10m rate=20r/s;

server {
    listen 80;
    server_name $DOMAIN;

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;

    location /v1/ {
        limit_req zone=api burst=40 nodelay;
        proxy_pass http://$BACKEND_IP:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://$FRONTEND_IP:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
CONF

sudo ln -sf "$SITE" /etc/nginx/sites-enabled/dominiohackctf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
echo "==> Lanzando certbot (TLS + HTTP/2 + redirección) para $DOMAIN"
# Email opcional: EMAIL=tucorreo bash ...  (si no, se registra sin email).
if [ -n "${EMAIL:-}" ]; then
  CERTBOT_ACCOUNT=(-m "$EMAIL")
else
  CERTBOT_ACCOUNT=(--register-unsafely-without-email)
fi
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos "${CERTBOT_ACCOUNT[@]}" --redirect || {
  echo "!! certbot falló (¿DNS ya apunta aquí?). Reintenta: sudo certbot --nginx -d $DOMAIN"
}
echo "==> Nginx configurado. WireGuard (UDP 51820) NO pasa por aquí: va directo al backend."
