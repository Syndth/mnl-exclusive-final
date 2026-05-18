<?php
$conn = new mysqli("localhost", "root", "daredevil88", "mnl_exclusive");

if ($conn->connect_error) {
    die("❌ Connection FAILED: " . $conn->connect_error);
}

echo "✅ Connected to database successfully!";

// Also check if users table exists
$result = $conn->query("SELECT COUNT(*) as total FROM users");
$row = $result->fetch_assoc();
echo "<br>👥 Users in table: " . $row['total'];
?>