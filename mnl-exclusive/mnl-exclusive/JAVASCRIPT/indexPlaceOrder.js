document.addEventListener("DOMContentLoaded", () => {
  const itemSubtotalEl = document.getElementById("itemSubtotal");
  const shippingEl = document.getElementById("shipping");
  const totalEl = document.getElementById("total");
  const form = document.getElementById("shippingForm");
  const orderTitleEl = document.getElementById("orderTitle");

  const count = localStorage.getItem("cartItemCount") || 0;
  orderTitleEl.textContent = `ORDER SUMMARY | ${count} ITEM(S)`;

  const subtotal = parseFloat(localStorage.getItem("cartSubtotal")) || 0;
  const shipping = subtotal > 0 ? 99 : 0;
  const total = subtotal + shipping;  

  itemSubtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
  shippingEl.textContent = `₱${shipping.toFixed(2)}`;
  totalEl.textContent = `₱${total.toFixed(2)}`;

  // Display selected items
  const selectedItems = JSON.parse(localStorage.getItem("orderItems")) || [];
  const summaryContainer = document.getElementById("orderSummaryItems");

  if (summaryContainer) {
    summaryContainer.innerHTML = "";
    if (selectedItems.length === 0) {
      summaryContainer.innerHTML = "<p>No selected items.</p>";
    } else {
      selectedItems.forEach(item => {
        const div = document.createElement("div");
        div.className = "summary-item";
        div.innerHTML = `
          <p><b>${item.name}</b></p>
          <p>${item.color}</p>
          <p>Qty: ${item.quantity}</p>
          <p>₱${item.price.toFixed(2)}</p>
        `;
        summaryContainer.appendChild(div);
      });
    }
  }

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name    = document.getElementById("fullname").value.trim();
    const phone   = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const postal  = document.getElementById("postal").value.trim();

    if (!name || !phone || !address || !postal) {
      alert("Please fill in all fields before continuing.");
      return;
    }

    const shippingInfo = { name, phone, address, postal, total, items: selectedItems };
    localStorage.setItem("shippingInfo", JSON.stringify(shippingInfo));

    alert("Proceeding to payment...");
    window.location.href = "./indexPay.html";
  });

  // ✅ FIXED: LoginPage.html → LoginPage.php
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
