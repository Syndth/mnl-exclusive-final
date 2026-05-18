<?php
// db.php — MNL EXCLUSIVE
$conn = new mysqli("localhost", "root", "daredevil88", "mnl_exclusive");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");
?>
