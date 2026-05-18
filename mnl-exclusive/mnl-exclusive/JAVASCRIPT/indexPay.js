document.addEventListener("DOMContentLoaded", () => {
    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const totalEl = document.getElementById("total");
    const form = document.getElementById("paymentForm");
    const backBtn = document.querySelector(".back-btn");

    // --- GET CART ITEMS ---
    const cart = JSON.parse(localStorage.getItem("cartItems")) || [];

    if (cart.length > 0) {
        localStorage.setItem("orderItem", cart.map(i => i.name).join(", "));
        localStorage.setItem("orderQuantity", cart.reduce((s, i) => s + i.quantity, 0));
        localStorage.setItem("orderPrice", cart[0].price);
    }

    // --- COMPUTE TOTAL ---
    const subtotal = parseFloat(localStorage.getItem("cartSubtotal")) || 0;
    const shipping = subtotal > 0 ? 99 : 0;
    const total = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `₱${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;

    // --- SHOW/HIDE PAYMENT DETAILS ---
    if (form) {
        form.addEventListener("change", (e) => {
            if (e.target.name === "payment") {
                const method = e.target.value;
                const gcash = document.getElementById("gcashDetails");
                const card = document.getElementById("cardDetails");
                if (gcash) gcash.style.display = method === "gcash" ? "block" : "none";
                if (card) card.style.display = method === "card" ? "block" : "none";
            }
        });
    }

    // --- CONFIRM PAYMENT FUNCTION ---
    function confirmPayment(e) {
        if (e) e.preventDefault();

        const checkedRadio = document.querySelector('input[name="payment"]:checked');

        if (!checkedRadio) {
            alert("Please select a payment method.");
            return;
        }

        const method = String(checkedRadio.value);

        localStorage.setItem("paymentMethod", method);
        localStorage.setItem("method", method);
        localStorage.setItem("orderTotal", String(total));

        alert("Payment confirmed via " + method.toUpperCase() + " ✅");
        window.location.href = "./indexOrderComplete.html";
    }

    // --- ATTACH TO FORM SUBMIT ---
    if (form) {
        form.addEventListener("submit", confirmPayment);
    }

    // --- ALSO ATTACH DIRECTLY TO BUTTON (safety net) ---
    const payBtn = document.querySelector(".pay-btn");
    if (payBtn) {
        payBtn.addEventListener("click", confirmPayment);
    }

    // --- BACK BUTTON ---
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.location.href = "./indexPlaceOrder.html";
        });
    }

    // --- FILE UPLOAD NAME ---
    const fileInput = document.getElementById("fileInput");
    const fileName = document.getElementById("fileName");

    if (fileInput && fileName) {
        fileInput.addEventListener("change", () => {
            fileName.textContent = fileInput.files.length > 0
                ? fileInput.files[0].name
                : "No file chosen";
        });
    }

    // --- PROFILE BUTTON ---
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
