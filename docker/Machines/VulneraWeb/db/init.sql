-- Base de datos del laboratorio VulneraWeb.
-- Entorno DELIBERADAMENTE vulnerable, solo para el lab aislado bajo gVisor.
-- Las contraseñas usan MD5 a propósito (lección de hashes débiles del CTF).

CREATE DATABASE IF NOT EXISTS vulneraweb;

-- Usuario con el que la app se conecta (bajo privilegio en MySQL).
CREATE USER IF NOT EXISTS 'webapp'@'localhost' IDENTIFIED BY 'webapp';
GRANT SELECT, INSERT, UPDATE ON vulneraweb.* TO 'webapp'@'localhost';

USE vulneraweb;

CREATE TABLE IF NOT EXISTS users (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50)  NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role     VARCHAR(20)  NOT NULL DEFAULT 'user'
);

-- Usuario normal (bajo privilegio). Contraseña: verano2024
INSERT INTO users (username, password, role) VALUES
  ('jlopez', MD5('verano2024'), 'user')
ON DUPLICATE KEY UPDATE username = username;

-- Administrador. La contraseña real queda expuesta más adelante vía LFI
-- (archivo de configuración del servidor). Contraseña: Adm1n_V3rano!
INSERT INTO users (username, password, role) VALUES
  ('admin', MD5('Adm1n_V3rano!'), 'admin')
ON DUPLICATE KEY UPDATE username = username;

FLUSH PRIVILEGES;
