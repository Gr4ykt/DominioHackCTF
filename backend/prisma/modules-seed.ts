// Contenido inicial de los módulos de aprendizaje (bilingüe ES/EN).
// Mati puede editar o reemplazar cada módulo desde /dashboard/admin/modules.
// El seed los crea/actualiza por `slug` y reemplaza sus preguntas en cada corrida.

export type SeedOption = {
  text_es: string;
  text_en: string;
  is_correct: boolean;
};

export type SeedQuestion = {
  question_es: string;
  question_en: string;
  type: 'multiple_choice' | 'fill_blank';
  order: number;
  // Respuesta esperada para fill_blank (se compara sin distinguir mayúsculas).
  answer?: string;
  options?: SeedOption[];
};

export type SeedModule = {
  slug: string;
  title_es: string;
  title_en: string;
  category: string;
  order: number;
  is_active: boolean;
  content_es: string;
  content_en: string;
  questions: SeedQuestion[];
};

const sqliEs = `# Introducción a SQL Injection

## ¿Qué es?
**SQL Injection (SQLi)** es una vulnerabilidad que permite a un atacante
interferir en las consultas que una aplicación envía a su base de datos.
Ocurre cuando la aplicación construye consultas SQL concatenando datos que
vienen del usuario **sin validarlos ni separarlos** del código de la consulta.

## ¿Por qué pasa?
Imagina un formulario de login que arma esta consulta:

\`\`\`sql
SELECT * FROM usuarios WHERE usuario = '$user' AND clave = '$pass';
\`\`\`

Si el atacante escribe en el campo usuario:

\`\`\`
' OR '1'='1
\`\`\`

la consulta resultante se convierte en:

\`\`\`sql
SELECT * FROM usuarios WHERE usuario = '' OR '1'='1' AND clave = '';
\`\`\`

Como \`'1'='1'\` siempre es verdadero, la condición se cumple y el atacante
entra sin conocer una contraseña válida. La comilla simple \`'\` es el carácter
clave: **cierra** la cadena y permite inyectar lógica propia.

## Tipos principales
- **In-band (clásica):** el resultado se ve directamente en la respuesta.
  - *Error-based:* se fuerzan errores de la base de datos para filtrar información.
  - *Union-based:* se usa \`UNION SELECT\` para añadir datos de otras tablas.
- **Blind (a ciegas):** la respuesta no muestra datos, pero cambia según si la
  condición es verdadera o falsa (*boolean-based*) o según el tiempo de
  respuesta (*time-based*, con funciones como \`SLEEP()\`).

## Cómo se detecta
Se prueban caracteres que rompen la sintaxis (\`'\`, \`"\`, \`)\`) y se observa:
un error SQL, un cambio en la respuesta o una demora. Herramientas como
**sqlmap** automatizan la detección y explotación.

## Cómo se previene
1. **Consultas parametrizadas / prepared statements:** los datos del usuario
   viajan separados del código SQL. Es la defensa principal.
2. **ORM** bien usado (Prisma, por ejemplo) que parametriza por defecto.
3. **Validación** de tipo y formato de entrada (allowlist).
4. **Mínimo privilegio** en el usuario de base de datos.

> La concatenación de strings para armar SQL es la raíz del problema.
> Parametrizar lo resuelve de raíz.
`;

const sqliEn = `# Introduction to SQL Injection

## What is it?
**SQL Injection (SQLi)** is a vulnerability that lets an attacker interfere
with the queries an application sends to its database. It happens when the
application builds SQL by concatenating user-supplied data **without validating
or separating it** from the query code.

## Why does it happen?
Picture a login form that builds this query:

\`\`\`sql
SELECT * FROM users WHERE username = '$user' AND password = '$pass';
\`\`\`

If the attacker types this into the username field:

\`\`\`
' OR '1'='1
\`\`\`

the resulting query becomes:

\`\`\`sql
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '';
\`\`\`

Since \`'1'='1'\` is always true, the condition passes and the attacker logs in
without a valid password. The single quote \`'\` is the key character: it
**closes** the string and lets attacker logic be injected.

## Main types
- **In-band (classic):** the result shows directly in the response.
  - *Error-based:* database errors are forced to leak information.
  - *Union-based:* \`UNION SELECT\` appends data from other tables.
- **Blind:** the response shows no data but changes depending on whether the
  condition is true or false (*boolean-based*) or on response time
  (*time-based*, using functions like \`SLEEP()\`).

## How it is detected
Try characters that break the syntax (\`'\`, \`"\`, \`)\`) and watch for a SQL
error, a change in the response, or a delay. Tools like **sqlmap** automate
detection and exploitation.

## How to prevent it
1. **Parameterized queries / prepared statements:** user data travels separate
   from the SQL code. This is the main defense.
2. A well-used **ORM** (Prisma, for example) that parameterizes by default.
3. **Validation** of input type and format (allowlist).
4. **Least privilege** for the database user.

> String concatenation to build SQL is the root cause.
> Parameterization fixes it at the root.
`;

const enumCtfEs = `# Enumeración en CTF

> "La enumeración lo es todo." En un CTF, el tiempo que inviertes recolectando
> información es el que más te acerca a la primera flag.

## ¿Qué es enumerar?
**Enumerar** es recolectar de forma ordenada toda la información posible sobre
el objetivo: puertos abiertos, servicios, versiones, rutas web, usuarios y
archivos. No se explota nada todavía; se construye el mapa del terreno.

## 1. Descubrimiento de puertos y servicios
El primer paso casi siempre es un escaneo con **nmap**:

\`\`\`bash
# Escaneo rápido de todos los puertos TCP
nmap -p- --min-rate 5000 -T4 10.20.1.2

# Detalle (versión y scripts por defecto) sobre los puertos encontrados
nmap -sC -sV -p 22,80 10.20.1.2
\`\`\`

- \`-p-\` escanea los 65535 puertos.
- \`-sV\` detecta la versión del servicio (clave para buscar exploits).
- \`-sC\` lanza los scripts por defecto de nmap.

## 2. Enumeración web
Si hay un puerto 80/443, el servicio web suele ser el camino:

\`\`\`bash
# Directorios y archivos ocultos
gobuster dir -u http://10.20.1.2 -w /usr/share/wordlists/dirb/common.txt

# Cabeceras y tecnología
whatweb http://10.20.1.2
\`\`\`

Revisa siempre: código fuente HTML, comentarios, \`robots.txt\`,
paneles de login, formularios y parámetros en la URL.

## 3. Toma de notas
Anota **todo**: versiones, rutas, credenciales encontradas, nombres de usuario.
Una credencial vista en un servicio suele servir en otro (*reutilización*).

## Metodología resumida
1. Escanear puertos → 2. Identificar servicios y versiones →
3. Enumerar cada servicio a fondo → 4. Buscar vectores conocidos →
5. Solo entonces, explotar.

> Si te atascas, casi siempre es porque falta enumerar algo. Vuelve atrás.
`;

const enumCtfEn = `# Enumeration in CTF

> "Enumeration is everything." In a CTF, the time you spend gathering
> information is what gets you closest to the first flag.

## What is enumeration?
**Enumeration** is methodically collecting every piece of information about the
target: open ports, services, versions, web paths, users and files. You exploit
nothing yet; you build the map of the terrain.

## 1. Port and service discovery
The first step is almost always an **nmap** scan:

\`\`\`bash
# Fast scan of all TCP ports
nmap -p- --min-rate 5000 -T4 10.20.1.2

# Detail (version and default scripts) on the ports found
nmap -sC -sV -p 22,80 10.20.1.2
\`\`\`

- \`-p-\` scans all 65535 ports.
- \`-sV\` detects the service version (key to finding exploits).
- \`-sC\` runs nmap's default scripts.

## 2. Web enumeration
If port 80/443 is open, the web service is often the way in:

\`\`\`bash
# Hidden directories and files
gobuster dir -u http://10.20.1.2 -w /usr/share/wordlists/dirb/common.txt

# Headers and technology
whatweb http://10.20.1.2
\`\`\`

Always check: HTML source, comments, \`robots.txt\`, login panels, forms and
URL parameters.

## 3. Taking notes
Write **everything** down: versions, paths, credentials found, usernames. A
credential seen on one service often works on another (*reuse*).

## Methodology in short
1. Scan ports → 2. Identify services and versions →
3. Enumerate each service thoroughly → 4. Look for known vectors →
5. Only then, exploit.

> If you get stuck, it is almost always because something is left to enumerate.
> Go back.
`;

const enumLinuxEs = `# Enumeración básica en Linux

Una vez que tienes acceso (una shell) a una máquina Linux, el objetivo es
entender el sistema para **escalar privilegios**. Aquí van las técnicas base.

## 1. ¿Quién soy y dónde estoy?
\`\`\`bash
id          # usuario, grupos y UID/GID
whoami
hostname
uname -a    # versión del kernel (puede tener exploits conocidos)
\`\`\`

## 2. Buscar archivos con \`find\`
\`find\` es la navaja suiza de la enumeración de archivos:

\`\`\`bash
# Archivos de un usuario concreto
find / -user root -name "*.conf" 2>/dev/null

# Archivos modificados recientemente
find / -mmin -10 -type f 2>/dev/null
\`\`\`

El \`2>/dev/null\` descarta los errores de "permiso denegado" para dejar la
salida limpia.

## 3. Archivos SUID
Un binario con el bit **SUID** se ejecuta con los permisos de su **dueño**, no
de quien lo lanza. Si un binario es propiedad de root y tiene SUID, puede ser
una vía directa a root:

\`\`\`bash
# Listar todos los binarios SUID del sistema
find / -perm -4000 -type f 2>/dev/null
\`\`\`

El \`-perm -4000\` busca el bit SUID. Luego se compara la lista con
[GTFOBins](https://gtfobins.github.io): si un binario SUID inusual aparece ahí
(por ejemplo \`find\`, \`vim\`, \`nmap\`), suele existir una forma de obtener una
shell de root con él.

Ejemplo clásico: si \`find\` tiene SUID,

\`\`\`bash
find . -exec /bin/sh -p \\; -quit
\`\`\`

lanza una shell con los privilegios del dueño del binario.

## 4. Otros vectores rápidos
\`\`\`bash
sudo -l                       # qué puedo ejecutar con sudo
cat /etc/crontab              # tareas programadas (posible escritura)
env                           # variables y rutas sensibles
ls -la /home/*                # archivos de otros usuarios
getcap -r / 2>/dev/null       # capabilities asignadas a binarios
\`\`\`

## Metodología
1. Contexto (id, kernel) → 2. SUID y \`sudo -l\` → 3. Cron y servicios →
4. Archivos legibles/escribibles sensibles → 5. Comparar hallazgos con GTFOBins.

> Automatiza con **linPEAS**, pero entiende qué busca cada comando: en la
> defensa oral tendrás que explicarlo.
`;

const enumLinuxEn = `# Basic Linux Enumeration

Once you have access (a shell) on a Linux box, the goal is to understand the
system in order to **escalate privileges**. Here are the base techniques.

## 1. Who am I and where am I?
\`\`\`bash
id          # user, groups and UID/GID
whoami
hostname
uname -a    # kernel version (may have known exploits)
\`\`\`

## 2. Finding files with \`find\`
\`find\` is the swiss army knife of file enumeration:

\`\`\`bash
# Files owned by a specific user
find / -user root -name "*.conf" 2>/dev/null

# Recently modified files
find / -mmin -10 -type f 2>/dev/null
\`\`\`

The \`2>/dev/null\` discards "permission denied" errors to keep the output clean.

## 3. SUID files
A binary with the **SUID** bit runs with the permissions of its **owner**, not
of whoever launches it. If a binary is owned by root and has SUID, it can be a
direct path to root:

\`\`\`bash
# List all SUID binaries on the system
find / -perm -4000 -type f 2>/dev/null
\`\`\`

\`-perm -4000\` searches for the SUID bit. Then compare the list with
[GTFOBins](https://gtfobins.github.io): if an unusual SUID binary appears there
(for example \`find\`, \`vim\`, \`nmap\`), there is usually a way to get a root
shell with it.

Classic example: if \`find\` has SUID,

\`\`\`bash
find . -exec /bin/sh -p \\; -quit
\`\`\`

spawns a shell with the privileges of the binary's owner.

## 4. Other quick vectors
\`\`\`bash
sudo -l                       # what I can run with sudo
cat /etc/crontab              # scheduled tasks (possible write access)
env                           # sensitive variables and paths
ls -la /home/*                # other users' files
getcap -r / 2>/dev/null       # capabilities assigned to binaries
\`\`\`

## Methodology
1. Context (id, kernel) → 2. SUID and \`sudo -l\` → 3. Cron and services →
4. Readable/writable sensitive files → 5. Compare findings with GTFOBins.

> Automate with **linPEAS**, but understand what each command looks for: in the
> oral defense you will have to explain it.
`;

export const SEED_MODULES: SeedModule[] = [
  {
    slug: 'sqli-intro',
    title_es: 'Introducción a SQL Injection',
    title_en: 'Introduction to SQL Injection',
    category: 'SQLi',
    order: 1,
    is_active: true,
    content_es: sqliEs,
    content_en: sqliEn,
    questions: [
      {
        question_es:
          '¿Qué carácter suele usarse para cerrar una cadena en una inyección SQL?',
        question_en:
          'Which character is commonly used to close a string in a SQL injection?',
        type: 'multiple_choice',
        order: 1,
        options: [
          { text_es: "Comilla simple (')", text_en: "Single quote (')", is_correct: true },
          { text_es: 'Arroba (@)', text_en: 'At sign (@)', is_correct: false },
          { text_es: 'Numeral (#)', text_en: 'Hash (#)', is_correct: false },
        ],
      },
      {
        question_es:
          '¿Cuál es la defensa principal contra SQL Injection?',
        question_en: 'What is the main defense against SQL Injection?',
        type: 'multiple_choice',
        order: 2,
        options: [
          {
            text_es: 'Consultas parametrizadas (prepared statements)',
            text_en: 'Parameterized queries (prepared statements)',
            is_correct: true,
          },
          {
            text_es: 'Ocultar los mensajes de error',
            text_en: 'Hiding error messages',
            is_correct: false,
          },
          {
            text_es: 'Usar HTTPS en el sitio',
            text_en: 'Using HTTPS on the site',
            is_correct: false,
          },
        ],
      },
      {
        question_es:
          'Completa: la técnica que usa el tiempo de respuesta para inferir datos se llama inyección ______ (time-based).',
        question_en:
          'Fill in: the technique that uses response time to infer data is called ______ injection (time-based).',
        type: 'fill_blank',
        order: 3,
        answer: 'blind',
      },
    ],
  },
  {
    slug: 'enum-ctf',
    title_es: 'Enumeración en CTF',
    title_en: 'Enumeration in CTF',
    category: 'Enumeración',
    order: 2,
    is_active: true,
    content_es: enumCtfEs,
    content_en: enumCtfEn,
    questions: [
      {
        question_es:
          '¿Qué herramienta se usa típicamente para escanear puertos y detectar versiones de servicios?',
        question_en:
          'Which tool is typically used to scan ports and detect service versions?',
        type: 'multiple_choice',
        order: 1,
        options: [
          { text_es: 'nmap', text_en: 'nmap', is_correct: true },
          { text_es: 'ffmpeg', text_en: 'ffmpeg', is_correct: false },
          { text_es: 'htop', text_en: 'htop', is_correct: false },
        ],
      },
      {
        question_es:
          'Completa el flag de nmap que escanea los 65535 puertos TCP: -__',
        question_en:
          'Fill in the nmap flag that scans all 65535 TCP ports: -__',
        type: 'fill_blank',
        order: 2,
        answer: 'p-',
      },
      {
        question_es:
          '¿Cuál de estos NO es un paso de enumeración, sino de explotación?',
        question_en:
          'Which of these is NOT an enumeration step, but an exploitation one?',
        type: 'multiple_choice',
        order: 3,
        options: [
          {
            text_es: 'Lanzar un exploit para obtener una shell',
            text_en: 'Launching an exploit to get a shell',
            is_correct: true,
          },
          {
            text_es: 'Listar directorios web con gobuster',
            text_en: 'Listing web directories with gobuster',
            is_correct: false,
          },
          {
            text_es: 'Detectar versiones de servicio con nmap',
            text_en: 'Detecting service versions with nmap',
            is_correct: false,
          },
        ],
      },
    ],
  },
  {
    slug: 'enum-linux',
    title_es: 'Enumeración básica en Linux',
    title_en: 'Basic Linux Enumeration',
    category: 'Linux',
    order: 3,
    is_active: true,
    content_es: enumLinuxEs,
    content_en: enumLinuxEn,
    questions: [
      {
        question_es:
          '¿Qué comando lista todos los binarios con el bit SUID en el sistema?',
        question_en:
          'Which command lists all binaries with the SUID bit on the system?',
        type: 'multiple_choice',
        order: 1,
        options: [
          {
            text_es: 'find / -perm -4000 -type f 2>/dev/null',
            text_en: 'find / -perm -4000 -type f 2>/dev/null',
            is_correct: true,
          },
          {
            text_es: 'ls -R / | grep suid',
            text_en: 'ls -R / | grep suid',
            is_correct: false,
          },
          {
            text_es: 'cat /etc/passwd | grep 4000',
            text_en: 'cat /etc/passwd | grep 4000',
            is_correct: false,
          },
        ],
      },
      {
        question_es:
          'Un binario SUID se ejecuta con los permisos de su ______ (no de quien lo lanza).',
        question_en:
          'A SUID binary runs with the permissions of its ______ (not of whoever launches it).',
        type: 'fill_blank',
        order: 2,
        answer: 'dueño',
      },
      {
        question_es:
          '¿Qué comando muestra qué puedes ejecutar con sudo?',
        question_en: 'Which command shows what you can run with sudo?',
        type: 'fill_blank',
        order: 3,
        answer: 'sudo -l',
      },
    ],
  },
];
