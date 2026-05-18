<?php
// ============================================================
//  products.php — Products & Categories API
//  Endpoints:
//    GET products.php                        → all active products
//    GET products.php?id=1                   → single product + reviews
//    GET products.php?category=tops          → filter by category slug
//    GET products.php?search=shirt           → search by name
//    GET products.php?categories=1           → list all categories
// ============================================================

require_once 'db.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db = get_db();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') send_json(['error' => 'Method not allowed'], 405);

// ── List categories ────────────────────────────────────────
if (isset($_GET['categories'])) {
    $res = $db->query("SELECT * FROM categories ORDER BY name");
    send_json($res->fetch_all(MYSQLI_ASSOC));
}

// ── Single product with reviews ────────────────────────────
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $db->prepare("
        SELECT p.*, c.name AS category
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.is_active = 1
    ");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();
    if (!$product) send_json(['error' => 'Product not found'], 404);

    $rev = $db->prepare("
        SELECT r.rating, r.comment, r.created_at, u.name AS reviewer
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
    ");
    $rev->bind_param('i', $id);
    $rev->execute();
    $product['reviews'] = $rev->get_result()->fetch_all(MYSQLI_ASSOC);

    // Average rating
    $avg = $db->prepare("SELECT ROUND(AVG(rating),1) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE product_id=?");
    $avg->bind_param('i', $id);
    $avg->execute();
    $product['rating_summary'] = $avg->get_result()->fetch_assoc();

    send_json($product);
}

// ── All products (with optional filter/search) ─────────────
$where  = ['p.is_active = 1'];
$params = [];
$types  = '';

if (!empty($_GET['category'])) {
    $where[]  = 'c.slug = ?';
    $params[] = $_GET['category'];
    $types   .= 's';
}

if (!empty($_GET['search'])) {
    $where[]  = 'p.name LIKE ?';
    $params[] = '%' . $_GET['search'] . '%';
    $types   .= 's';
}

$where_sql = implode(' AND ', $where);

$sql = "
    SELECT p.id, p.name, p.price, p.stock_qty, p.sizes, p.colors, p.image_url,
           c.name AS category, c.slug AS category_slug,
           ROUND(AVG(r.rating), 1) AS avg_rating,
           COUNT(r.id) AS review_count
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN reviews r ON r.product_id = p.id
    WHERE $where_sql
    GROUP BY p.id
    ORDER BY p.created_at DESC
";

if ($params) {
    $stmt = $db->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
} else {
    $result = $db->query($sql)->fetch_all(MYSQLI_ASSOC);
}

send_json($result);
