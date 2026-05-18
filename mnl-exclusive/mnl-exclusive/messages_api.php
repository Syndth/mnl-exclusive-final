<?php
// messages_api.php — MNL EXCLUSIVE
// Endpoints:
//   GET  messages_api.php              → get all messages
//   POST messages_api.php?action=read  → mark as read
//   POST messages_api.php?action=delete → delete message

session_start();
require_once 'db.php';

header('Content-Type: application/json');

// Block non-admins
if (!isset($_SESSION['userRole']) || $_SESSION['userRole'] !== 'admin') {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? 'list';

switch ($action) {

    // ── GET ALL MESSAGES ──────────────────────────────────
    case 'list':
        $result = $conn->query("
            SELECT id, name, email, subject, message, is_read,
                   DATE_FORMAT(created_at, '%b %d, %Y') AS date
            FROM messages
            ORDER BY created_at DESC
        ");
        $messages = $result->fetch_all(MYSQLI_ASSOC);
        echo json_encode([
            'messages'    => $messages,
            'unread'      => array_sum(array_column($messages, 'is_read') === array_fill(0, count($messages), 0)
                ? array_column($messages, 'is_read')
                : array_map(fn($m) => $m['is_read'] == 0 ? 1 : 0, $messages)),
            'admin_name'  => $_SESSION['userName'] ?? 'Admin'
        ]);
        break;

    // ── MARK AS READ ──────────────────────────────────────
    case 'read':
        $body = json_decode(file_get_contents('php://input'), true);
        $id   = intval($body['id'] ?? 0);
        if (!$id) { echo json_encode(['error' => 'ID required']); exit; }

        $stmt = $conn->prepare("UPDATE messages SET is_read = 1 WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;

    // ── DELETE MESSAGE ────────────────────────────────────
    case 'delete':
        $body = json_decode(file_get_contents('php://input'), true);
        $id   = intval($body['id'] ?? 0);
        if (!$id) { echo json_encode(['error' => 'ID required']); exit; }

        $stmt = $conn->prepare("DELETE FROM messages WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode(['error' => 'Unknown action']);
}

$conn->close();
?>
