<?php
// dashboard_data.php — MNL EXCLUSIVE Admin API
// Powers: Dashboard, Analytics, Reports, Messages
session_start();
require_once 'db.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Block non-admins
if (!isset($_SESSION['userRole']) || $_SESSION['userRole'] !== 'admin') {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? 'dashboard';

switch ($action) {

    // ── DASHBOARD ────────────────────────────────────────────
    case 'dashboard':
        // Total sales today
        $sales = $conn->query("
            SELECT COALESCE(SUM(total_amount), 0) AS total
            FROM orders
            WHERE DATE(ordered_at) = CURDATE()
            AND status != 'cancelled'
        ")->fetch_assoc();

        // Total orders today
        $orders_today = $conn->query("
            SELECT COUNT(*) AS total
            FROM orders
            WHERE DATE(ordered_at) = CURDATE()
        ")->fetch_assoc();

        // Total orders all time (for % progress)
        $orders_all = $conn->query("SELECT COUNT(*) AS total FROM orders")->fetch_assoc();

        // Income = paid payments today
        $income = $conn->query("
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM payments
            WHERE status = 'paid'
            AND DATE(paid_at) = CURDATE()
        ")->fetch_assoc();

        // Recent 5 orders
        $recent = $conn->query("
            SELECT o.id, u.fullname, oi.quantity,
                   p.name AS product_name, o.status, o.total_amount, o.ordered_at,
                   pay.method AS payment_method, pay.status AS payment_status
            FROM orders o
            JOIN users u ON u.id = o.user_id
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id
            LEFT JOIN payments pay ON pay.order_id = o.id
            ORDER BY o.ordered_at DESC
            LIMIT 5
        ")->fetch_all(MYSQLI_ASSOC);

        // Recent delivered orders (for Recent Updates panel)
        $delivered = $conn->query("
            SELECT u.fullname, o.updated_at
            FROM orders o
            JOIN users u ON u.id = o.user_id
            WHERE o.status = 'delivered'
            ORDER BY o.updated_at DESC
            LIMIT 3
        ")->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            'sales'        => number_format($sales['total'], 2),
            'income'       => number_format($income['total'], 2),
            'orders_today' => $orders_today['total'],
            'orders_all'   => $orders_all['total'],
            'recent_orders'=> $recent,
            'delivered'    => $delivered,
            'admin_name'   => $_SESSION['userName'] ?? 'Admin'
        ]);
        break;

    // ── ANALYTICS ────────────────────────────────────────────
    case 'analytics':
        // Summary cards
        $revenue = $conn->query("
            SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE status != 'cancelled'
        ")->fetch_assoc();

        $total_orders = $conn->query("SELECT COUNT(*) AS total FROM orders")->fetch_assoc();

        $new_customers = $conn->query("
            SELECT COUNT(*) AS total FROM users
            WHERE role = 'user'
            AND MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
        ")->fetch_assoc();

        $avg_order = $conn->query("
            SELECT COALESCE(AVG(total_amount),0) AS avg FROM orders WHERE status != 'cancelled'
        ")->fetch_assoc();

        // Monthly sales (last 7 months)
        $monthly = $conn->query("
            SELECT DATE_FORMAT(ordered_at, '%b') AS month,
                   MONTH(ordered_at) AS month_num,
                   COALESCE(SUM(total_amount), 0) AS total
            FROM orders
            WHERE ordered_at >= DATE_SUB(CURDATE(), INTERVAL 7 MONTH)
            AND status != 'cancelled'
            GROUP BY MONTH(ordered_at), DATE_FORMAT(ordered_at, '%b')
            ORDER BY month_num ASC
        ")->fetch_all(MYSQLI_ASSOC);

        // Top selling products
        $top_products = $conn->query("
            SELECT p.name,
                   SUM(oi.quantity) AS units_sold,
                   SUM(oi.quantity * oi.unit_price) AS revenue
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN orders o ON o.id = oi.order_id
            WHERE o.status != 'cancelled'
            GROUP BY p.id
            ORDER BY units_sold DESC
            LIMIT 4
        ")->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            'total_revenue'  => number_format($revenue['total'], 2),
            'total_orders'   => $total_orders['total'],
            'new_customers'  => $new_customers['total'],
            'avg_order'      => number_format($avg_order['avg'], 2),
            'monthly_sales'  => $monthly,
            'top_products'   => $top_products,
            'admin_name'     => $_SESSION['userName'] ?? 'Admin'
        ]);
        break;

    // ── REPORTS ──────────────────────────────────────────────
    case 'reports':
        $from   = $_GET['from']   ?? date('Y-m-01');
        $to     = $_GET['to']     ?? date('Y-m-d');
        $status = $_GET['status'] ?? '';

        $where = "WHERE DATE(o.ordered_at) BETWEEN ? AND ?";
        $params = [$from, $to];
        $types  = 'ss';

        if ($status) {
            $where  .= " AND o.status = ?";
            $params[] = $status;
            $types   .= 's';
        }

        $stmt = $conn->prepare("
            SELECT o.id, u.fullname AS customer, p.name AS product,
                   oi.quantity, oi.unit_price,
                   (oi.quantity * oi.unit_price) AS amount,
                   o.ordered_at, o.status
            FROM orders o
            JOIN users u ON u.id = o.user_id
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p ON p.id = oi.product_id
            $where
            ORDER BY o.ordered_at DESC
        ");
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Summary
        $sum_stmt = $conn->prepare("
            SELECT COALESCE(SUM(total_amount),0) AS revenue,
                   COUNT(*) AS order_count
            FROM orders o $where
        ");
        $sum_stmt->bind_param($types, ...$params);
        $sum_stmt->execute();
        $summary = $sum_stmt->get_result()->fetch_assoc();

        echo json_encode([
            'rows'    => $rows,
            'revenue' => number_format($summary['revenue'], 2),
            'count'   => $summary['order_count'],
            'admin_name' => $_SESSION['userName'] ?? 'Admin'
        ]);
        break;

    default:
        echo json_encode(['error' => 'Unknown action']);
}

$conn->close();
?>
