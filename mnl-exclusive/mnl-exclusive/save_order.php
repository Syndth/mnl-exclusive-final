<?php
header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

require_once "db.php"; // uses $conn mysqli connection

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "error" => "No data received"]);
    exit;
}

$user_id          = isset($data["user_id"]) ? intval($data["user_id"]) : null;
$total_amount     = floatval($data["total"] ?? 0);
$shipping_address = trim(
    ($data["full_name"]   ?? "") . ", " .
    ($data["address"]     ?? "") . ", " .
    ($data["postal_code"] ?? "")
);
$status = "Pending";

$stmt = $conn->prepare("INSERT INTO orders (user_id, status, total_amount, shipping_address) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isds", $user_id, $status, $total_amount, $shipping_address);

if ($stmt->execute()) {
    $order_id = $conn->insert_id;
    echo json_encode(["success" => true, "order_id" => $order_id]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}

$stmt->close();
$conn->close();
?>
