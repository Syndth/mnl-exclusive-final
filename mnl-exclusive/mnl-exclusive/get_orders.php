<?php
header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

require_once "db.php";

$result = $conn->query("
    SELECT o.id, o.user_id, o.status, o.total_amount, o.shipping_address, o.ordered_at,
           u.fullname, u.email
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.ordered_at DESC
");

if (!$result) {
    echo json_encode(["success" => false, "error" => $conn->error]);
    exit;
}

$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}

echo json_encode(["success" => true, "orders" => $orders]);
$conn->close();
?>
