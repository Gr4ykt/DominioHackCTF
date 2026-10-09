<?php
session_start();
if (empty($_SESSION['user']) || ($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    exit('Acceso restringido a administradores.');
}

$QDIR = '/var/www/maintenance';
$output = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $cmd = $_POST['cmd'] ?? '';
    // =====================================================================
    // VULNERABILIDAD 3 — Escalada vertical por la consola admin (INTENCIONAL).
    // La "consola de mantenimiento" encola el comando ingresado, que un worker
    // del sistema ejecuta como ROOT sin sandbox. El admin del panel obtiene así
    // ejecución como root (root.txt). Escalada app-admin -> OS-root.
    // =====================================================================
    file_put_contents("$QDIR/cmd", $cmd);
    for ($i = 0; $i < 25 && file_exists("$QDIR/cmd"); $i++) {
        usleep(200000); // espera a que el worker root procese el comando
    }
    $output = @file_get_contents("$QDIR/result");
    if ($output === false) { $output = '(sin salida)'; }
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VulneraWeb — Consola admin</title>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <header><a href="/panel.php">Panel</a> <a href="/logout.php">Salir</a></header>
  <div class="wrap">
    <div class="card">
      <h2>Consola de mantenimiento</h2>
      <p>Ejecuta tareas de mantenimiento del servidor.</p>
      <form method="post" action="/admin.php">
        <label for="cmd">Comando</label>
        <input id="cmd" name="cmd" autocomplete="off" placeholder="id">
        <button type="submit">Ejecutar</button>
      </form>
      <?php if ($output !== null): ?>
        <h3>Salida</h3>
        <pre><?= htmlspecialchars($output) ?></pre>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
