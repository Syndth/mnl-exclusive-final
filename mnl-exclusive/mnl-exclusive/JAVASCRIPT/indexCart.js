// js/indexCart.js

document.addEventListener("DOMContentLoaded", () => {
    const findEl = (selClass, selId) => document.querySelector(selClass) || document.getElementById(selId);

    const cartItemsContainer = findEl("#cart-items-container"); 
    const subtotalEl = findEl(".subtotal-value", "subtotal");
    const shippingEl = findEl(".shipping-value", "shipping");
    const totalEl = findEl(".total-value", "total");
    const discountEl = findEl(".discount-value", "discount");
    const voucherInput = findEl(".voucher-input", "voucher");
    const applyVoucherBtn = findEl(".apply-voucher", "apply");
    const checkoutBtn = findEl(".checkout-btn", "checkoutBtn");
    const itemCountEl = document.getElementById("itemCount");

    let discount = 0;
    let fixedDiscountAmount = 0;

    function getCartItemElements() {
        return Array.from(document.querySelectorAll(".cart-item"));
    }

    function parsePrice(text) {
        if (!text && text !== 0) return 0;
        const cleaned = String(text).replace(/[^0-9.\-]+/g, "");
        const v = parseFloat(cleaned);
        return Number.isFinite(v) ? v : 0;
    }

    function displayCartItems() {
        const storedCartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        cartItemsContainer.innerHTML = '';

        if (storedCartItems.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-message">Your cart is empty. <a href="./HomePage.html#new">Start shopping!</a></p>';
            if (checkoutBtn) checkoutBtn.setAttribute('disabled', 'disabled');
            if (applyVoucherBtn) applyVoucherBtn.setAttribute('disabled', 'disabled');
            discount = 0;
            fixedDiscountAmount = 0;
            if (voucherInput) delete voucherInput.dataset.fixedDiscount;
        } else {
            if (checkoutBtn) checkoutBtn.removeAttribute('disabled');
            if (applyVoucherBtn) applyVoucherBtn.removeAttribute('disabled');

            storedCartItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item');
                itemElement.dataset.itemId = `${item.id}-${item.color}-${item.size}`;

                itemElement.innerHTML = `
                    <input type="checkbox" class="select-item">
                    <img src="${item.imageUrl}" alt="${item.name}" class="item-thumbnail">
                    <div class="item-details">
                        <h4 class="item-name">${item.name}</h4>
                        <p class="item-variant">Color: ${item.color}, Size: ${item.size}</p>
                        <p class="item-price">₱${item.price.toFixed(2)}</p>
                    </div>
                    <div class="item-qty-controls">
                        <button class="decrease" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="qty">${item.quantity}</span>
                        <button class="increase">+</button>
                    </div>
                    <button class="remove-item"><i class="fas fa-trash-alt"></i></button>
                `;
                cartItemsContainer.appendChild(itemElement);
            });
        }
        calculateTotals();
    }

    function calculateTotals() {
        const items = getCartItemElements();
        let rawSubtotal = 0;
        let qtyCount = 0;

        items.forEach(itemEl => {
            const checkbox = itemEl.querySelector(".select-item");
            const selected = checkbox ? checkbox.checked : true;

            const priceEl = itemEl.querySelector(".item-price");
            const qtyEl = itemEl.querySelector(".qty");

            const price = parsePrice(priceEl ? priceEl.textContent : 0);
            const qty = qtyEl ? parseInt(qtyEl.textContent, 10) || 0 : 0;

            if (selected) {
                rawSubtotal += price * qty;
                qtyCount += qty;
            }
        });

        let currentDiscountValue = 0;
        if (fixedDiscountAmount > 0) {
            currentDiscountValue = fixedDiscountAmount;
        } else if (discount > 0) {
            currentDiscountValue = rawSubtotal * discount;
        }

        const discountedSubtotal = Math.max(0, rawSubtotal - currentDiscountValue);
        const shippingFee = rawSubtotal > 0 ? 99 : 0;
        const total = discountedSubtotal + shippingFee;

        if (subtotalEl) subtotalEl.textContent = `₱${discountedSubtotal.toFixed(2)}`;
        if (shippingEl) shippingEl.textContent = `₱${shippingFee.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
        if (discountEl) discountEl.textContent = `-₱${currentDiscountValue.toFixed(2)}`;
        if (itemCountEl) itemCountEl.textContent = qtyCount;

        localStorage.setItem("cartSubtotal", discountedSubtotal.toFixed(2));
        localStorage.setItem("cartItemCount", qtyCount);
        localStorage.setItem("cartTotal", total.toFixed(2));
    }

    document.addEventListener("click", (e) => {
        const inc = e.target.closest(".increase");
        const dec = e.target.closest(".decrease");
        const remove = e.target.closest(".remove-item");
        const itemEl = e.target.closest(".cart-item");

        if (inc || dec) {
            const qtyEl = itemEl.querySelector(".qty");
            let qty = parseInt(qtyEl.textContent, 10) || 0;

            if (inc) qty++;
            if (dec && qty > 1) qty--;

            qtyEl.textContent = qty;
            itemEl.querySelector(".decrease").disabled = (qty <= 1);

            const itemId = itemEl.dataset.itemId;
            let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            const itemIndex = cartItems.findIndex(item => `${item.id}-${item.color}-${item.size}` === itemId);
            if (itemIndex > -1) {
                cartItems[itemIndex].quantity = qty;
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
            }
            calculateTotals();
        }

        if (remove) {
            if (!itemEl) return;
            const itemIdToRemove = itemEl.dataset.itemId;

            itemEl.classList.add("fade-out");
            setTimeout(() => {
                let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
                cartItems = cartItems.filter(item => `${item.id}-${item.color}-${item.size}` !== itemIdToRemove);
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                itemEl.remove();
                displayCartItems();
            }, 260);
        }
    });

    document.addEventListener("change", (e) => {
        if (e.target && e.target.matches(".select-item")) {
            calculateTotals();
        }
    });

    if (applyVoucherBtn && voucherInput) {
        applyVoucherBtn.addEventListener("click", () => {
            const code = voucherInput.value.trim().toUpperCase();
            if (!code) {
                discount = 0;
                fixedDiscountAmount = 0;
                alert("Please enter a voucher code.");
                calculateTotals();
                return;
            }

            if (code === "MNL10") {
                discount = 0; fixedDiscountAmount = 10;
                alert("Voucher applied: ₱10 off ✅");
            } else if (code === "MNL50") {
                discount = 0; fixedDiscountAmount = 50;
                alert("Voucher applied: ₱50 off ✅");
            } else if (code === "EXCLUSIVE") {
                discount = 0; fixedDiscountAmount = 100;
                alert("Voucher applied: ₱100 off ✅");
            } else if (code === "MNLOFF") {
                discount = 0.10; fixedDiscountAmount = 0;
                alert("Voucher applied: 10% off ✅");
            } else {
                discount = 0; fixedDiscountAmount = 0;
                alert("Invalid voucher code ❌");
            }
            calculateTotals();
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const totalNum = parsePrice(totalEl?.textContent || "0");
            const subtotalNum = parsePrice(subtotalEl?.textContent || "0");

            const selectedItems = [];
            document.querySelectorAll(".cart-item").forEach(itemEl => {
                const checkbox = itemEl.querySelector(".select-item");
                if (checkbox && checkbox.checked) {
                    selectedItems.push({
                        name: itemEl.querySelector(".item-name").textContent,
                        color: itemEl.querySelector(".item-variant").textContent,
                        price: parsePrice(itemEl.querySelector(".item-price").textContent),
                        quantity: parseInt(itemEl.querySelector(".qty").textContent)
                    });
                }
            });

            if (selectedItems.length === 0) {
                alert("Please select at least one item before checking out.");
                return;
            }

            // Save combined item names and total quantity
            localStorage.setItem("orderItem", selectedItems.map(i => i.name).join(", "));
            localStorage.setItem("orderQuantity", selectedItems.reduce((s, i) => s + i.quantity, 0));
            localStorage.setItem("orderItems", JSON.stringify(selectedItems));
            localStorage.setItem("cartSubtotal", subtotalNum.toFixed(2));
            localStorage.setItem("cartItemCount", selectedItems.reduce((s, i) => s + i.quantity, 0));
            localStorage.setItem("cartTotal", totalNum.toFixed(2));

            window.location.href = "./indexPlaceOrder.html";
        });
    }

    // ✅ FIXED: LoginPage.html → LoginPage.php
    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) {
        profileBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (localStorage.getItem("isLoggedIn") === "true") {
                window.location.href = "./profile.html";
            } else {
                window.location.href = "./LoginPage.php";
            }
        });
    }

    displayCartItems();
});
