<?php
session_start();
if (empty($_SESSION['user'])) { header('Location: /login.php'); exit; }

// Página de contenido a mostrar en el panel.
$page = $_GET['page'] ?? 'pages/ayuda.php';
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VulneraWeb — Panel</title>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <header>
    <a href="/panel.php?page=pages/ayuda.php">Ayuda</a>
    <a href="/panel.php?page=pages/reportes.php">Reportes</a>
    <?php if (($_SESSION['role'] ?? '') === 'admin'): ?>
      <a href="/admin.php">Consola admin</a>
    <?php endif; ?>
    <a href="/logout.php">Salir</a>
  </header>
  <div class="wrap">
    <div class="card">
      <!--
        NOTA INTERNA (dev): migración desde el sistema antiguo pendiente.
        Los respaldos de configuración siguen en ../private/ (credentials.conf)
        y el archivo de usuario en ../private/user.txt. Mover fuera del servidor
        y limpiar antes de pasar a producción. -TI
      -->
      <p class="msg ok">Conectado como <strong><?= htmlspecialchars($_SESSION['user']) ?></strong>
        (rol: <?= htmlspecialchars($_SESSION['role']) ?>)</p>
      <?php
        // ===============================================================
        // VULNERABILIDAD 2 — Local File Inclusion (INTENCIONAL, lab aislado).
        // El parámetro ?page= se incluye sin validar la ruta, permitiendo
        // path traversal (?page=../../../../etc/passwd) y lectura de archivos
        // del servidor: la flag de usuario (../private/user.txt) y las
        // credenciales del admin (../private/credentials.conf).
        // ===============================================================
        include __DIR__ . '/' . $page;
      ?>
    </div>
  </div>
</body>
</html>
