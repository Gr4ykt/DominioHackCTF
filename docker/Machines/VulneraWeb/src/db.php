<?php
// Conexión a la base de datos local del laboratorio (MariaDB en el mismo contenedor).
$DB_HOST = '127.0.0.1';
$DB_USER = 'webapp';
$DB_PASS = 'webapp';
$DB_NAME = 'vulneraweb';

$conn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($conn->connect_errno) {
    http_response_code(500);
    exit('Error de conexión a la base de datos.');
}
