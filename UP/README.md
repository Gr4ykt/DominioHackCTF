# UP — Scripts de arranque

Dos conjuntos de scripts:

- **Raíz de `UP/`** (`01-wireguard-server.sh`, `02-backend-sudoers.sh`,
  `wireguard-down.sh`): dejan **este equipo** (host de pruebas local) como
  servidor WireGuard de desarrollo. Autodetectan la IP de la LAN. Para probar
  con una VM en red puente, sin AWS.
- **Subcarpetas `backend/` `frontend/` `nginx/` `wazuh/`**: despliegue en
  **producción (AWS)**, un conjunto por servidor, según
  [`docs/DESPLIEGUE_AWS.md`](../docs/DESPLIEGUE_AWS.md).

Todos se ejecutan **como tu usuario normal** (piden `sudo` donde hace falta),
uno por uno, en orden.

---

## Producción (AWS) — orden por servidor

### 1. Backend EC2  (`UP/backend/`)
```bash
bash UP/backend/01-install.sh                 # docker, node+pnpm, gVisor (systrap)
#  ↑ agrega tu usuario al grupo docker: cierra sesión SSH y vuelve a entrar.
WG_SERVER_ENDPOINT=<ELASTIC_IP_BACKEND>:51820 bash UP/backend/02-wireguard-server.sh
bash UP/backend/03-sudoers.sh                 # wg/iptables sin root para el backend
# crea backend/.env  (copia UP/backend/backend.env.example y reemplaza <...>)
bash UP/backend/05-deploy.sh                  # imágenes + migrate deploy + build + systemd
# cuando el SIEM esté arriba:
WAZUH_MANAGER=<IP_PRIVADA_WAZUH> bash UP/backend/04-wazuh-agent.sh
```

### 2. Frontend EC2  (`UP/frontend/`)
```bash
bash UP/frontend/01-install.sh                # node + pnpm
# crea frontend/.env.production  (copia UP/frontend/frontend.env.production.example)
bash UP/frontend/02-deploy.sh                 # build + systemd (:3000)
```

### 3. Nginx EC2  (`UP/nginx/`)
```bash
bash UP/nginx/01-install.sh                   # nginx + certbot
DOMAIN=<DOMINIO> BACKEND_IP=<IP_PRIV_BACKEND> FRONTEND_IP=<IP_PRIV_FRONTEND> \
  bash UP/nginx/02-config.sh                  # vhost (/ front, /v1 back) + TLS
```
> El DNS del dominio debe apuntar a la Elastic IP de Nginx **antes** de certbot.

### 4. Wazuh EC2  (`UP/wazuh/`)
```bash
bash UP/wazuh/01-install.sh                   # manager + indexer + dashboard
# guarda la URL del dashboard y la clave 'admin' que imprime
```

---

## Qué `.env` va en cada servidor

| Servidor | Archivo | Plantilla | Claves que debes rellenar |
|---|---|---|---|
| **Backend** | `backend/.env` | `UP/backend/backend.env.example` | `DATABASE_URL` (RDS), `MONGO_URI` (Atlas), `JWT_SECRET` (`openssl rand -hex 32`), `CORS_ORIGIN`/`FRONTEND_URL`/`COOKIE_DOMAIN` (= tu dominio), `GOOGLE_*`, `WG_SERVER_PUBLIC_KEY` + `WG_SERVER_ENDPOINT` (los imprime el script 02) |
| **Frontend** | `frontend/.env.production` | `UP/frontend/frontend.env.production.example` | `NEXT_PUBLIC_API_URL=https://<dominio>/v1` (se incrusta en el build) |
| **Nginx** | — | — | No usa `.env`; su config la escribe `UP/nginx/02-config.sh` |
| **Wazuh** | — | — | No usa `.env` de la app; credenciales en `wazuh-install-files.tar` |
| **RDS** | — | — | No lleva `.env`; su cadena vive en `DATABASE_URL` del backend |
| **MongoDB Atlas** | — | — | No lleva `.env`; su cadena vive en `MONGO_URI` del backend. Acceso por allowlist de IP (Elastic IP del backend) |

> Los dos datos que desbloquean el `.env` del backend son la **Elastic IP del
> backend** (para `WG_SERVER_ENDPOINT`) y el **`MONGO_URI`** de Atlas.
> Nunca subas ningún `.env` a git (ya está en `.gitignore`).

---

## Host de pruebas local (sin AWS)

1. `bash UP/01-wireguard-server.sh` — crea `wg0` (10.10.0.1/24, UDP 51820),
   genera las claves, habilita el reenvío y **actualiza `backend/.env`**
   (`WG_MODE=cli`, `FIREWALL_MODE=cli`, claves y endpoint de la LAN).
2. `bash UP/02-backend-sudoers.sh` (una vez) — `wg`/`iptables` sin contraseña.
3. Reinicia el backend para que lea el `.env`.
4. Desde una VM en **red puente**: plataforma → VPN → descargar `.conf` →
   `sudo wg-quick up ./dominiohackctf.conf` → inicia un lab y accede a 10.20.x.2.

Apagar: `bash UP/wireguard-down.sh` baja `wg0` (no borra nada). Para volver al
modo local sin VPN real: en `backend/.env` pon `WG_MODE=dev` y `FIREWALL_MODE=dev`
y reinicia el backend.
