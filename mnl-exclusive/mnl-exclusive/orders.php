<?php
// ============================================================
//  orders.php — Orders API
//  Endpoints:
//    GET  orders.php?user_id=1        → list user orders
//    GET  orders.php?order_id=1       → single order detail
//    POST orders.php                  → place new order (checkout)
//    POST orders.php?action=status    → update order status (admin)
// ============================================================

require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db     = get_db();
$method = $_SERVER['REQUEST_METHOD'];

//  List orders or single order
if ($method === 'GET') {
    if (isset($_GET['order_id'])) {
        $order_id = intval($_GET['order_id']);

        $stmt = $db->prepare("
            SELECT o.*, p.method AS payment_method, p.status AS payment_status, p.reference_no
            FROM orders o
            LEFT JOIN payments p ON p.order_id = o.id
            WHERE o.id = ?
        ");
        $stmt->bind_param('i', $order_id);
        $stmt->execute();
        $order = $stmt->get_result()->fetch_assoc();
        if (!$order) send_json(['error' => 'Order not found'], 404);

        $items_stmt = $db->prepare("
            SELECT oi.*, p.name, p.image_url
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
        ");
        $items_stmt->bind_param('i', $order_id);
        $items_stmt->execute();
        $order['items'] = $items_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        send_json($order);
    }

    if (isset($_GET['user_id'])) {
        $user_id = intval($_GET['user_id']);
        $stmt = $db->prepare("
            SELECT o.id, o.status, o.total_amount, o.ordered_at,
                   COUNT(oi.id) AS item_count
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.ordered_at DESC
        ");
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        send_json($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    }

    send_json(['error' => 'user_id or order_id required'], 400);
}

//  POST: Place order (checkout) 
if ($method === 'POST') {
    $body = get_body();
    $action = $_GET['action'] ?? '';

    // Update order status (admin use)
    if ($action === 'status') {
        $order_id = intval($body['order_id'] ?? 0);
        $status   = $body['status'] ?? '';
        $allowed  = ['pending','processing','shipped','delivered','cancelled'];
        if (!$order_id || !in_array($status, $allowed)) send_json(['error' => 'Invalid data'], 400);

        $upd = $db->prepare("UPDATE orders SET status=? WHERE id=?");
        $upd->bind_param('si', $status, $order_id);
        $upd->execute();
        send_json(['message' => 'Order status updated']);
    }

    // Checkout: create order from cart
    $user_id          = intval($body['user_id']          ?? 0);
    $shipping_address = trim($body['shipping_address']   ?? '');
    $payment_method   = trim($body['payment_method']     ?? 'cod');

    if (!$user_id || !$shipping_address) send_json(['error' => 'user_id and shipping_address required'], 400);

    // Fetch cart items
    $cart_stmt = $db->prepare("
        SELECT ci.quantity, ci.size, p.id AS product_id, p.price, p.stock_qty
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id = ?
    ");
    $cart_stmt->bind_param('i', $user_id);
    $cart_stmt->execute();
    $cart = $cart_stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (empty($cart)) send_json(['error' => 'Cart is empty'], 400);

    // Check stock & calculate total
    $total = 0;
    foreach ($cart as $item) {
        if ($item['stock_qty'] < $item['quantity']) {
            send_json(['error' => "Insufficient stock for product ID {$item['product_id']}"], 400);
        }
        $total += $item['price'] * $item['quantity'];
    }

    $db->begin_transaction();
    try {
        // Create order
        $ord = $db->prepare("INSERT INTO orders (user_id, total_amount, shipping_address) VALUES (?,?,?)");
        $ord->bind_param('ids', $user_id, $total, $shipping_address);
        $ord->execute();
        $order_id = $db->insert_id;

        // Insert order items & deduct stock
        foreach ($cart as $item) {
            $oi = $db->prepare("INSERT INTO order_items (order_id, product_id, quantity, unit_price, size) VALUES (?,?,?,?,?)");
            $oi->bind_param('iiids', $order_id, $item['product_id'], $item['quantity'], $item['price'], $item['size']);
            $oi->execute();

            $deduct = $db->prepare("UPDATE products SET stock_qty = stock_qty - ? WHERE id=?");
            $deduct->bind_param('ii', $item['quantity'], $item['product_id']);
            $deduct->execute();
        }

        // Create payment record
        $pay = $db->prepare("INSERT INTO payments (order_id, method, amount) VALUES (?,?,?)");
        $pay->bind_param('isd', $order_id, $payment_method, $total);
        $pay->execute();

        // Clear cart
        $clr = $db->prepare("DELETE FROM cart_items WHERE user_id=?");
        $clr->bind_param('i', $user_id);
        $clr->execute();

        $db->commit();
        send_json(['message' => 'Order placed successfully', 'order_id' => $order_id, 'total' => $total], 201);

    } catch (Exception $e) {
        $db->rollback();
        send_json(['error' => 'Checkout failed: ' . $e->getMessage()], 500);
    }
}

send_json(['error' => 'Method not allowed'], 405);
