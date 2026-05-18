<?php
// ============================================================
//  cart.php — Cart API
//  Endpoints:
//    GET    cart.php?user_id=1        → view cart
//    POST   cart.php                  → add item
//    DELETE cart.php                  → remove item
//    DELETE cart.php?clear=1&user_id=1 → clear cart
// ============================================================

require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db     = get_db();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: View cart ─────────────────────────────────────────
if ($method === 'GET') {
    $user_id = intval($_GET['user_id'] ?? 0);
    if (!$user_id) send_json(['error' => 'user_id required'], 400);

    $stmt = $db->prepare("
        SELECT ci.id, ci.quantity, ci.size,
               p.id AS product_id, p.name, p.price, p.image_url,
               (ci.quantity * p.price) AS subtotal
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
        ORDER BY ci.added_at DESC
    ");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $total = array_sum(array_column($result, 'subtotal'));
    send_json(['items' => $result, 'total' => $total]);
}

// ── POST: Add item to cart ─────────────────────────────────
if ($method === 'POST') {
    $body       = get_body();
    $user_id    = intval($body['user_id']    ?? 0);
    $product_id = intval($body['product_id'] ?? 0);
    $quantity   = intval($body['quantity']   ?? 1);
    $size       = trim($body['size']         ?? '');

    if (!$user_id || !$product_id) send_json(['error' => 'user_id and product_id required'], 400);

    // If item already in cart, update quantity
    $check = $db->prepare("SELECT id, quantity FROM cart_items WHERE user_id=? AND product_id=? AND size=?");
    $check->bind_param('iis', $user_id, $product_id, $size);
    $check->execute();
    $existing = $check->get_result()->fetch_assoc();

    if ($existing) {
        $new_qty = $existing['quantity'] + $quantity;
        $upd = $db->prepare("UPDATE cart_items SET quantity=? WHERE id=?");
        $upd->bind_param('ii', $new_qty, $existing['id']);
        $upd->execute();
        send_json(['message' => 'Cart updated', 'cart_item_id' => $existing['id']]);
    } else {
        $ins = $db->prepare("INSERT INTO cart_items (user_id, product_id, quantity, size) VALUES (?,?,?,?)");
        $ins->bind_param('iiis', $user_id, $product_id, $quantity, $size);
        $ins->execute();
        send_json(['message' => 'Item added to cart', 'cart_item_id' => $db->insert_id], 201);
    }
}

// ── DELETE: Remove item or clear cart ─────────────────────
if ($method === 'DELETE') {
    // Clear entire cart
    if (isset($_GET['clear']) && isset($_GET['user_id'])) {
        $user_id = intval($_GET['user_id']);
        $del = $db->prepare("DELETE FROM cart_items WHERE user_id=?");
        $del->bind_param('i', $user_id);
        $del->execute();
        send_json(['message' => 'Cart cleared']);
    }

    // Remove single item
    $body        = get_body();
    $cart_item_id = intval($body['cart_item_id'] ?? 0);
    if (!$cart_item_id) send_json(['error' => 'cart_item_id required'], 400);

    $del = $db->prepare("DELETE FROM cart_items WHERE id=?");
    $del->bind_param('i', $cart_item_id);
    $del->execute();
    send_json(['message' => 'Item removed']);
}

send_json(['error' => 'Method not allowed'], 405);
