# Máquina Vulnerable 1 — VulneraWeb

## 1. Descripción general

VulneraWeb es la primera máquina vulnerable del motor de laboratorios de DominioHackCTF, clasificada en dificultad **Easy**. Simula una aplicación web administrativa típica construida sobre un stack legacy (PHP + MySQL), en la que coexisten tres fallos de seguridad independientes que, encadenados, permiten a un atacante pasar de usuario anónimo a control total del sistema (root). El objetivo pedagógico es introducir al usuario a las categorías de vulnerabilidad más comunes en aplicaciones web mal diseñadas: **SQL Injection**, **Local File Inclusion** y **escalación de privilegios vertical a través de una funcionalidad administrativa mal controlada**.

La máquina se distribuye como una imagen Docker autocontenida, pensada para el modelo "llegar y levantar": un único contenedor expone el servicio web vulnerable y no requiere configuración adicional por parte del usuario del CTF más allá del acceso vía VPN WireGuard al laboratorio.

## 2. Objetivos de aprendizaje

| Categoría | Concepto que se evalúa |
|---|---|
| SQL Injection | Construcción de queries dinámicas sin sanitización; bypass de autenticación mediante inyección en formularios de login |
| Local File Inclusion | Inclusión de archivos del servidor a partir de un parámetro controlado por el usuario sin validación de ruta |
| Privilege Escalation (vertical) | Abuso de una funcionalidad administrativa (consola interactiva) que ejecuta comandos con privilegios elevados, accesible tras obtener credenciales de mayor nivel |

## 3. Stack técnico

- **Servidor web:** Apache 2.4
- **Lenguaje backend:** PHP 7.x/8.x (versión antigua intencional, sin los mitigadores de frameworks modernos)
- **Base de datos:** MySQL / MariaDB
- **Sistema base:** Debian (imagen mínima)
- **Aislamiento de ejecución:** contenedor Docker ejecutado bajo gVisor (`runsc`), consistente con el resto del motor de laboratorios
- **Persistencia de la sesión de ataque:** sin persistencia entre reinicios — la máquina se restaura a su estado inicial en cada levantamiento, conforme al modelo de auto-expiración del motor

## 4. Superficie de ataque y cadena de explotación

La máquina expone un único servicio HTTP con tres puntos de entrada relevantes, diseñados para resolverse en el orden siguiente:

### 4.1 Punto de entrada 1 — SQL Injection (acceso inicial)

- Un formulario de login (`/login.php`) construye la consulta de autenticación concatenando directamente el input del usuario, sin prepared statements ni escapado de caracteres especiales.
- El campo de usuario y/o contraseña es inyectable mediante técnicas clásicas (`' OR '1'='1`, UNION-based injection) para:
  - Evadir la autenticación y acceder como un usuario válido de bajo privilegio, o
  - Extraer directamente credenciales almacenadas en la tabla de usuarios (hashes, a crackear o reutilizar).
- Resultado esperado: acceso autenticado al panel de usuario con un rol estándar (no administrador).

### 4.2 Punto de entrada 2 — Local File Inclusion (post-autenticación)

- Dentro del panel de usuario, una funcionalidad de visualización de contenido (p. ej. un sistema de "páginas de ayuda" o "plantillas de reporte") carga archivos del servidor a partir de un parámetro no validado: `panel.php?page=ayuda`.
- El parámetro `page` es manipulable mediante path traversal (`../../../../etc/passwd`, wrappers PHP si se busca subir la dificultad) para leer archivos arbitrarios del sistema de archivos del contenedor.
- El objetivo de esta etapa no es ejecución de código, sino **reconocimiento y extracción de información sensible**: archivos de configuración de la aplicación (credenciales de base de datos, claves internas) y, críticamente, pistas o credenciales que habilitan el acceso al panel de administrador.
- Resultado esperado: obtención de credenciales o información suficiente para autenticarse como administrador.

### 4.3 Punto de entrada 3 — Escalación de privilegios vertical (consola interactiva del admin)

- El panel de administrador incluye una funcionalidad legítima de "consola de mantenimiento" o "terminal de diagnóstico", pensada originalmente para tareas operativas simples, pero implementada sin restricciones: ejecuta los comandos ingresados directamente en el sistema operativo con los privilegios del proceso del servidor web (o, para forzar una escalación vertical explícita, con privilegios root vía un mecanismo mal configurado, por ejemplo un script invocado con permisos elevados).
- Al autenticarse como administrador (usando las credenciales obtenidas vía LFI), el usuario accede a esta consola y la utiliza para ejecutar comandos arbitrarios, obteniendo una shell con privilegios de root.
- Esta etapa constituye la escalación vertical: un usuario que llegó con privilegios de aplicación (admin del panel) termina con privilegios de sistema operativo (root).

## 5. Flags

| Flag | Punto de obtención | Nivel de acceso demostrado |
|---|---|---|
| `user.txt` | Tras explotar la LFI y acceder al sistema de archivos como usuario del servicio web | Acceso de aplicación / lectura de archivos |
| `root.txt` | Tras la escalación de privilegios mediante la consola interactiva del panel admin | Control total del sistema (root) |

## 6. Flujo de resolución esperado (resumen)

1. Reconocimiento del servicio web expuesto.
2. Explotación de SQLi en el login → acceso autenticado de bajo privilegio.
3. Explotación de LFI en el panel de usuario → extracción de credenciales de administrador (`user.txt` disponible en este punto).
4. Autenticación como administrador → acceso a la consola interactiva.
5. Ejecución de comandos arbitrarios vía la consola → shell con privilegios root (`root.txt`).

## 7. Consideraciones de diseño

- Las tres vulnerabilidades son independientes entre sí a nivel de código, pero están encadenadas narrativamente mediante las credenciales expuestas por la LFI, de modo que el usuario debe resolver los pasos en orden para avanzar.
- No se introducen mecanismos de ofuscación ni filtros parciales (WAF, blacklist de caracteres) en esta primera máquina, consistente con su clasificación Easy; estos elementos quedan reservados como posible variante de dificultad superior a futuro.
- La consola interactiva del panel admin es el elemento central de la lección de privesc: ilustra un antipatrón real y frecuente (funcionalidad administrativa con ejecución de comandos sin sandboxing ni control de privilegios), más que una técnica de escalación a nivel de sistema operativo (SUID, cron, etc.), que se reserva para máquinas futuras.