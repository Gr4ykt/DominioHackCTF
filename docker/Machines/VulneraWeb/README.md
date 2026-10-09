# VulneraWeb — Máquina vulnerable 1

> ⚠️ **Entorno deliberadamente vulnerable.** Esta imagen contiene fallos de
> seguridad **intencionales** (SQLi, LFI, ejecución de comandos) con fines
> educativos. Está pensada **exclusivamente** para ejecutarse dentro del
> laboratorio aislado del motor de DominioHackCTF: contenedor efímero bajo
> **gVisor (`runsc`)**, en una red bridge **sin salida a internet ni acceso al
> host** (ver validación en `claude/HALLAZGOS.md` H-11). **No** desplegar en una
> red real ni ejecutar fuera del laboratorio.

Dificultad: **Easy**. Especificación completa en `VULNERAWEB.MD`.

## Estado

**Completa y probada (09-oct).** Las tres vulnerabilidades están implementadas y
la cadena de explotación completa funciona bajo gVisor (9/9 verificaciones):

1. **SQL Injection** en el login (`src/login.php`) — bypass de autenticación.
2. **Local File Inclusion** en el panel (`src/panel.php`) — lectura de archivos.
3. **Escalada a root** por la consola del admin (`src/admin.php`) — RCE como root.

## Ejecutar en un solo paso

```bash
cd docker/Machines/VulneraWeb
docker compose up --build        # construye y levanta (bajo gVisor, en 127.0.0.1:8081)
# ... probar en http://localhost:8081
docker compose down              # detener y eliminar
```

## Estructura

```
VulneraWeb/
├── Dockerfile              Imagen única: Apache + PHP 8.2 + MariaDB
├── config/
│   ├── no-native-aio.cnf   Ajuste de InnoDB para que arranque bajo gVisor (H-03)
│   └── apache-vulneraweb.conf
├── db/init.sql             Esquema + usuarios (contraseñas MD5, a propósito)
├── flags/
│   ├── user.txt            Se obtiene vía LFI (legible por www-data)
│   └── root.txt            Se obtiene tras la escalada (solo root)
├── scripts/entrypoint.sh   Arranca MariaDB, carga el esquema y Apache
└── src/                    Código PHP de la app vulnerable
```

## Construir y probar en local

```bash
cd docker/Machines/VulneraWeb

# Construir la imagen
docker build -t vulneraweb:latest .

# Ejecutar bajo gVisor (igual que en el motor de labs), publicando el puerto
# SOLO para pruebas locales (en producción no se publica: se llega por VPN).
docker run -d --rm --name vulneraweb-test --runtime=runsc -p 8081:80 vulneraweb:latest

# Probar
curl -s http://localhost:8081/            # portal
#  navegar a http://localhost:8081/login.php e ingresar: jlopez / verano2024

# Detener
docker rm -f vulneraweb-test
```

## Credenciales del laboratorio (para pruebas de desarrollo)

| Usuario | Contraseña | Rol |
|---|---|---|
| `jlopez` | `verano2024` | user |
| `admin` | `Adm1n_V3rano!` | admin |

En el CTF real el usuario no las conoce: las obtiene explotando SQLi (hashes a
crackear) y LFI (la del admin queda expuesta en un archivo de configuración).

## Cadena de explotación (writeup resumido)

1. **SQLi** en `/login.php`: `usuario = ' OR '1'='1'-- -` → entra como `jlopez` (rol user).
2. **Pista:** en el código fuente del panel (clic derecho → ver código fuente)
   hay un comentario de desarrollador que menciona la carpeta `../private/`.
3. **LFI** en `/panel.php?page=` (el parámetro se ve en los enlaces del menú):
   - `../private/user.txt` → **flag de usuario**.
   - `../private/credentials.conf` → contraseña del admin (`Adm1n_V3rano!`).
   - (`../../../../etc/passwd` confirma la lectura arbitraria de archivos.)
3. Login como `admin` con la clave filtrada → aparece la **Consola de mantenimiento**.
4. En la consola: `cat /root/root.txt` se ejecuta como **root** → **flag de root**.

## Nota técnica (gVisor)

La escalada **no** usa `sudo`/setuid: bajo gVisor el bit setuid no se honra
(`sudo: effective uid is not 0 ... nosuid`, ver `claude/HALLAZGOS.md` H-12). En su
lugar, un worker (`dh-worker.sh`) que el entrypoint lanza **como root** procesa los
comandos que el panel admin (www-data) encola en `/var/www/maintenance/`. Es el
mismo antipatrón ("tarea de mantenimiento privilegiada mal controlada") y funciona
bajo `runsc`.

## Flags

| Flag | Dónde | Cómo se obtiene |
|---|---|---|
| `user.txt` | `/var/www/private/user.txt` | LFI (lectura de archivos como www-data) |
| `root.txt` | `/root/root.txt` | Escalada vía consola admin (RCE como root) |

Las flags viven en texto plano **solo** dentro de la imagen. En la base de datos
de la plataforma se guarda únicamente su hash (SHA-256 + salt), según la decisión
de flags estáticas por máquina.

## Notas de diseño

- **Un solo contenedor** (modelo "llegar y levantar"): Apache + PHP + MariaDB.
- **Sin persistencia**: la base se reinicializa en cada arranque; cada sesión de
  lab parte de un estado limpio, acorde al modelo efímero del motor.
- **gVisor**: MariaDB requiere `no-native-aio.cnf` para arrancar bajo `runsc`
  (lo que no se logró con DVWA). Validar el arranque al construir la imagen.
