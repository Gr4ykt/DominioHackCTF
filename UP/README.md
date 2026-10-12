# UP — Scripts de preparación del servidor

Scripts para dejar este equipo (sistema base) como **servidor de pruebas** de
DominioHackCTF. Pensados para ejecutarse **como tu usuario normal** (piden sudo
donde hace falta), uno por uno.

## Orden

1. **`bash UP/01-wireguard-server.sh`**
   Configura el servidor WireGuard: crea `wg0` (10.10.0.1/24, UDP 51820),
   genera las claves del servidor, habilita el reenvío de IP, abre el puerto y
   **actualiza `backend/.env`** (`WG_MODE=cli`, `FIREWALL_MODE=cli`,
   `WG_SERVER_PUBLIC_KEY`, `WG_SERVER_ENDPOINT`, `WG_USE_SUDO=true`).
   Imprime la clave pública y el endpoint.

2. **`bash UP/02-backend-sudoers.sh`** (una sola vez)
   Permite al backend ejecutar `wg` e `iptables` como root sin contraseña
   (regla sudoers acotada a esos binarios).

3. **Reiniciar el backend** para que lea el nuevo `.env`.
   El backend, al arrancar en modo `cli`, crea las cadenas base de iptables
   (`DHCTF-FWD`, `DHCTF-IN`) y, al iniciar cada lab, agrega las reglas
   usuario ↔ subred.

## Probar desde una VM

- La VM debe estar en **red puente (bridged)** para alcanzar la IP de este
  equipo en la red local (la que imprime el script 01).
- En la plataforma: inicia sesión → **VPN** → *Descargar configuración*.
- En la VM: importa el `.conf` y `sudo wg-quick up ./dominiohackctf.conf`.
- Inicia un laboratorio desde la plataforma y accede a la máquina por su IP
  (10.20.x.2) a través del túnel.

## Apagar

- `bash UP/wireguard-down.sh` baja `wg0` (no borra nada).
- Para volver al modo local sin VPN real: en `backend/.env` pon `WG_MODE=dev`
  y `FIREWALL_MODE=dev`, y reinicia el backend.
