<?php
// login_process.php — FIXED for mysqli
session_start();
require_once "db.php";

header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set("display_errors", 0); // Don't expose errors to browser in production

$data     = json_decode(file_get_contents("php://input"), true);
$email    = trim($data["email"]    ?? "");
$password = trim($data["password"] ?? "");

if (!$email || !$password) {
    echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
    exit;
}

$stmt = $conn->prepare("SELECT id, fullname, password, role FROM users WHERE email = ? LIMIT 1");

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Query error: " . $conn->error]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();

if (!$user || !password_verify($password, $user["password"])) {
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    exit;
}

// Save session
$_SESSION["isLoggedIn"] = true;
$_SESSION["userRole"]   = $user["role"];
$_SESSION["userName"]   = $user["fullname"];
$_SESSION["userId"]     = $user["id"];

$redirect = $user["role"] === "admin" ? "./AdminDashboard.html" : "./HomePage.html";

echo json_encode([
    "success"  => true,
    "role"     => $user["role"],
    "userId"   => $user["id"],
    "userName" => $user["fullname"],
    "redirect" => $redirect
]);

$stmt->close();
$conn->close();
?>
