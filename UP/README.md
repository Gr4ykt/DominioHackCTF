# UP — Scripts de arranque

Dos conjuntos de scripts:

- **Raíz de `UP/`** (`01-wireguard-server.sh`, `02-backend-sudoers.sh`,
  `wireguard-down.sh`): dejan **este equipo** (host de pruebas local) como
  servidor WireGuard de desarrollo. Autodetectan la IP de la LAN. Para probar
  con una VM en red puente, sin AWS.
- **Subcarpetas `backend/` `frontend/` `nginx/`**: despliegue en
  **producción (AWS, capa gratuita)**, un conjunto por servidor.

Todos se ejecutan **como tu usuario normal** (piden `sudo` donde hace falta).

---

## Topología (capa gratuita, Ubuntu 24.04)

| Servidor | Instancia | Rol | Puertos públicos |
|---|---|---|---|
| **Backend** | t3.small | NestJS + Docker/gVisor + WireGuard | UDP 51820 (WireGuard); 3001 solo desde la IP privada del nginx |
| **Frontend** | t3.micro | Next.js (`:3000`) | 3000 solo desde la IP privada del nginx |
| **Nginx** | t3.micro | Reverse proxy + TLS (entrada pública) | 80, 443 |
| **RDS** | Aurora PostgreSQL | Base de datos relacional | 5432 solo desde la IP privada del backend |
| **MongoDB** | Atlas M0 (externo) | Eventos/KPIs (logs) | — (SaaS; allowlist = Elastic IP del backend) |

- **Sin Wazuh** (queda fuera del 80%, se añade después con su propio servidor/agente).
- **MongoDB es Atlas M0** (externo, gratis). No se instala nada en el backend:
  solo pegas la cadena SRV en `MONGO_URI` y añades la Elastic IP del backend al
  allowlist de Atlas (Network Access).
- **RDS y Atlas los configuras tú**. Los scripts solo se conectan (`DATABASE_URL`,
  `MONGO_URI`).
- Guía detallada de AWS, RDS y Atlas: [`docs/CONFIGURACION_SERVIDORES.md`](../docs/CONFIGURACION_SERVIDORES.md).

> Grupos de seguridad (los configuras en AWS): nginx abre 80/443 a internet;
> el backend abre UDP 51820 a internet y 3001 solo a la IP privada del nginx;
> el frontend abre 3000 solo a la IP privada del nginx; RDS abre 5432 solo a la
> IP privada del backend. Todo lo demás, cerrado.

---

## Producción — un comando por servidor

Cada servidor tiene un `setup.sh` que encadena sus pasos en orden.

### 1. Backend (t3.small)
```bash
# FASE 1: instala todo, levanta WireGuard e imprime la clave pública del servidor.
WG_SERVER_ENDPOINT=<ELASTIC_IP_BACKEND>:51820 bash UP/backend/setup.sh

# Entremedio: crea backend/.env con los secretos reales.
cp UP/backend/backend.env.example backend/.env
#   edita: DATABASE_URL (RDS Aurora), JWT_SECRET (openssl rand -hex 32),
#          WG_SERVER_PUBLIC_KEY (la que imprimió la fase 1), dominio, GOOGLE_*

# FASE 2: detecta backend/.env y despliega (imágenes + migrate deploy + build + systemd).
WG_SERVER_ENDPOINT=<ELASTIC_IP_BACKEND>:51820 bash UP/backend/setup.sh
```
El paso de instalación te agrega al grupo `docker`; el servicio systemd toma ese
grupo al arrancar aunque no reinicies la sesión SSH.

### 2. Frontend (t3.micro)
```bash
cp UP/frontend/frontend.env.production.example frontend/.env.production
#   edita NEXT_PUBLIC_API_URL=https://<DOMINIO>/v1   (se incrusta en el build)
bash UP/frontend/setup.sh
```

### 3. Nginx (t3.micro)
```bash
# El DNS del dominio debe apuntar YA a la IP pública de este servidor (certbot).
DOMAIN=<DOMINIO> BACKEND_IP=<IP_PRIV_BACKEND> FRONTEND_IP=<IP_PRIV_FRONTEND> \
  bash UP/nginx/setup.sh
```

> Prefieres paso a paso en vez del `setup.sh`: los scripts numerados
> (`01-install.sh`, `02-…`, …) se pueden correr sueltos en ese mismo orden.

---

## Qué `.env` va en cada servidor

| Servidor | Archivo | Plantilla | Claves que debes rellenar |
|---|---|---|---|
| **Backend** | `backend/.env` | `UP/backend/backend.env.example` | `DATABASE_URL` (RDS Aurora), `MONGO_URI` (Atlas M0), `JWT_SECRET` (`openssl rand -hex 32`), `CORS_ORIGIN`/`FRONTEND_URL`/`COOKIE_DOMAIN` (= tu dominio), `GOOGLE_*` (opcional), `WG_SERVER_PUBLIC_KEY` + `WG_SERVER_ENDPOINT` (los imprime el paso 02) |
| **Frontend** | `frontend/.env.production` | `UP/frontend/frontend.env.production.example` | `NEXT_PUBLIC_API_URL=https://<dominio>/v1` (se incrusta en el build) |
| **Nginx** | — | — | No usa `.env`; su config la escribe `UP/nginx/02-config.sh` |
| **RDS** | — | — | No lleva `.env`; su cadena vive en `DATABASE_URL` del backend |

> El dato que desbloquea el `.env` del backend es la **Elastic IP del backend**
> (para `WG_SERVER_ENDPOINT`), más el endpoint de **RDS Aurora** para `DATABASE_URL`.
> Nunca subas ningún `.env` a git (ya está en `.gitignore`).

---

## Operación

```bash
# Backend
journalctl -u dhctf-backend -f           # logs
sudo systemctl restart dhctf-backend     # reinicio

# Frontend
journalctl -u dhctf-frontend -f
sudo systemctl restart dhctf-frontend
```

El primer usuario que se registre queda como **superusuario**.

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
