document.addEventListener("DOMContentLoaded", () => {

  const info     = JSON.parse(localStorage.getItem("shippingInfo")) || {};
  const items    = JSON.parse(localStorage.getItem("orderItems"))   || [];
  const item     = localStorage.getItem("orderItem")     || "No item";
  const quantity = localStorage.getItem("orderQuantity") || "0";
  const method   = localStorage.getItem("paymentMethod") || "N/A";
  const rawTotal = info.total || localStorage.getItem("orderTotal") || 0;
  const total    = `₱${parseFloat(rawTotal).toFixed(2)}`;

  document.getElementById("name").textContent     = info.name    || "Unknown";
  document.getElementById("address").textContent  = info.address || "No address";
  document.getElementById("item").textContent     = item;
  document.getElementById("quantity").textContent = quantity;
  document.getElementById("method").textContent   = method.toUpperCase();
  document.getElementById("total").textContent    = total;

  let orders = JSON.parse(localStorage.getItem("allOrders")) || [];
  orders.push({
    name:     info.name,
    address:  info.address,
    item:     item,
    quantity: quantity,
    total:    total,
    payment:  method.toUpperCase(),
    status:   "Pending",
    date:     new Date().toLocaleString()
  });
  localStorage.setItem("allOrders", JSON.stringify(orders));

  const userId = localStorage.getItem("userId");

  const orderPayload = {
    user_id:        userId ? parseInt(userId) : null,
    full_name:      info.name      || "",
    phone:          info.phone     || "",
    address:        info.address   || "",
    postal_code:    info.postal    || "",
    subtotal:       parseFloat(localStorage.getItem("cartSubtotal")) || 0,
    shipping_fee:   99,
    discount:       0,
    total:          parseFloat(rawTotal) || 0,
    payment_method: method.toLowerCase(),
    voucher_code:   localStorage.getItem("appliedVoucher") || null,
    items:          items
  };

  fetch("save_order.php", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(orderPayload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log("✅ Order saved! ID:", data.order_id);
    } else {
      console.warn("⚠️ Error:", data.error);
    }
  })
  .catch(err => console.warn("⚠️ fetch failed:", err));

  document.querySelector(".home-btn").addEventListener("click", () => {
    localStorage.removeItem("shippingInfo");
    localStorage.removeItem("paymentMethod");
    localStorage.removeItem("orderItem");
    localStorage.removeItem("orderQuantity");
    localStorage.removeItem("orderPrice");
    localStorage.removeItem("cartItems");
    localStorage.removeItem("cartSubtotal");
    localStorage.removeItem("cartItemCount");
    localStorage.removeItem("cartTotal");
    localStorage.removeItem("orderItems");
    localStorage.removeItem("orderTotal");
    localStorage.removeItem("appliedVoucher");
    window.location.href = "./HomePage.html";
  });

  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "./profile.html";
      } else {
        window.location.href = "./LoginPage.php";
      }
    });
  }
});