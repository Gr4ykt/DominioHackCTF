<?php session_start(); ?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VulneraWeb — Portal</title>
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
  <header>
    <a href="/index.php">Inicio</a>
    <a href="/login.php">Ingresar</a>
    <?php if (!empty($_SESSION['user'])): ?>
      <a href="/panel.php">Mi panel</a>
      <a href="/logout.php">Salir</a>
    <?php endif; ?>
  </header>
  <div class="wrap">
    <div class="card">
      <h1>VulneraWeb</h1>
      <p>Portal administrativo interno de la empresa (ficticio).</p>
      <p>Inicia sesión para acceder a tu panel.</p>
      <?php if (!empty($_SESSION['user'])): ?>
        <p class="msg ok">Sesión activa como <strong><?= htmlspecialchars($_SESSION['user']) ?></strong>.</p>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
