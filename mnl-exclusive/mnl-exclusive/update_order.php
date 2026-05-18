<?php
header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

require_once "db.php";

$data     = json_decode(file_get_contents("php://input"), true);
$order_id = intval($data["order_id"] ?? 0);
$status   = $data["status"] ?? "";

// ✅ All valid ENUM values from your orders table
$allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];
if (!$order_id || !in_array($status, $allowed)) {
    echo json_encode(["success" => false, "error" => "Invalid status: $status"]);
    exit;
}

$stmt = $conn->prepare("UPDATE orders SET status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $order_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}

$stmt->close();
$conn->close();
?>
