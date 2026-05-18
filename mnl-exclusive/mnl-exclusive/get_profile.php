<?php
header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

require_once "db.php";

$data    = json_decode(file_get_contents("php://input"), true);
$user_id = intval($data["user_id"] ?? 0);

if (!$user_id) {
    echo json_encode(["success" => false, "error" => "No user ID"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, fullname, email, ROLE, created_at FROM users WHERE id = ? LIMIT 1");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();

if (!$user) {
    echo json_encode(["success" => false, "error" => "User not found"]);
    exit;
}

// Get order count for this user
$orderStmt = $conn->prepare("SELECT COUNT(*) as total FROM orders WHERE user_id = ?");
$orderStmt->bind_param("i", $user_id);
$orderStmt->execute();
$orderResult = $orderStmt->get_result()->fetch_assoc();

echo json_encode([
    "success"     => true,
    "id"          => $user["id"],
    "fullname"    => $user["fullname"],
    "email"       => $user["email"],
    "role"        => $user["ROLE"],
    "created_at"  => $user["created_at"],
    "order_count" => $orderResult["total"]
]);

$stmt->close();
$conn->close();
?>
