<?php
require 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received.']);
    exit;
}

$firstname = trim($data['firstname'] ?? '');
$lastname  = trim($data['lastname']  ?? '');
$email     = trim($data['email']     ?? '');
$password  = trim($data['password']  ?? '');
$gender    = trim($data['gender']    ?? '');

if (!$firstname || !$lastname || !$email || !$password || !$gender) {
    echo json_encode(['success' => false, 'message' => 'Please complete all fields.']);
    exit;
}

// Check if email already exists
$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Email is already registered!']);
    exit;
}

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
$fullname = $firstname . ' ' . $lastname;

// Insert into database
$stmt = $conn->prepare("INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, 'user')");
$stmt->bind_param("sss", $fullname, $email, $hashedPassword);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Registration failed. Try again.']);
}

$stmt->close();
$conn->close();
?>