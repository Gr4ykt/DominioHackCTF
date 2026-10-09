<?php
session_start();
require __DIR__ . '/db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    // =====================================================================
    // VULNERABILIDAD 1 — SQL Injection (INTENCIONAL, lab aislado).
    // La consulta se construye concatenando el input sin prepared statements
    // ni escapado. Permite bypass de autenticación (p. ej.  ' OR '1'='1'--  )
    // e inyección UNION para extraer los hashes de la tabla users.
    // Camino previsto (Easy): bypass -> entra como el primer usuario (rol user).
    // =====================================================================
    $query = "SELECT username, role FROM users "
           . "WHERE username = '$username' AND password = MD5('$password')";
    $res = $conn->query($query);

    if ($res && ($row = $res->fetch_assoc())) {
        $_SESSION['user'] = $row['username'];
        $_SESSION['role'] = $row['role'];
        header('Location: /panel.php');
        exit;
    }
    $error = 'Credenciales inválidas.';
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VulneraWeb — Ingresar</title>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <header><a href="/index.php">Inicio</a></header>
  <div class="wrap">
    <div class="card">
      <h2>Iniciar sesión</h2>
      <?php if ($error): ?><p class="msg err"><?= htmlspecialchars($error) ?></p><?php endif; ?>
      <form method="post" action="/login.php">
        <label for="username">Usuario</label>
        <input id="username" name="username" autocomplete="off">
        <label for="password">Contraseña</label>
        <input id="password" name="password" type="password">
        <button type="submit">Ingresar</button>
      </form>
    </div>
  </div>
</body>
</html>
