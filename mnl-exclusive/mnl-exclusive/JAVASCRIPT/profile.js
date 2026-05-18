document.addEventListener("DOMContentLoaded", () => {

    // ===========================
    // LOGIN CHECK
    // ===========================
    const userId = localStorage.getItem("userId");
    if (localStorage.getItem("isLoggedIn") !== "true" || !userId) {
        window.location.href = "./LoginPage.php";
        return;
    }

    // ===========================
    // LOAD REAL USER DATA FROM DB
    // ===========================
    fetch("get_profile.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: parseInt(userId) })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Update name in sidebar
            const nameEl = document.querySelector(".user-info h2");
            if (nameEl) nameEl.textContent = data.fullname;

            // Update profile details using IDs
            const detailName  = document.getElementById("detail-name");
            const detailEmail = document.getElementById("detail-email");
            const detailPhone = document.getElementById("detail-phone");
            const detailSince = document.getElementById("detail-since");

            if (detailName)  detailName.textContent  = data.fullname;
            if (detailEmail) detailEmail.textContent = data.email;
            if (detailPhone) detailPhone.textContent = "—";
            if (detailSince) detailSince.textContent = new Date(data.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

            // Update order count
            const statsH3 = document.querySelectorAll(".user-stats h3");
            if (statsH3[0]) statsH3[0].textContent = data.order_count || 0;

            // Update welcome message
            const welcomeH1 = document.querySelector(".top-banner h1");
            if (welcomeH1) welcomeH1.textContent = `Welcome Back, ${data.fullname.split(" ")[0]} 👋`;

            localStorage.setItem("userName", data.fullname);
        }
    })
    .catch(err => console.warn("Could not load profile:", err));

    // ===========================
    // LOAD REAL ORDERS FROM DB
    // ===========================
    fetch("get_orders.php")
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Filter orders for this user only
            const myOrders = data.orders.filter(o => String(o.user_id) === String(userId));

            // To Pay = pending
            const toPay = myOrders.filter(o => o.status === "pending");
            // To Ship = processing
            const toShip = myOrders.filter(o => o.status === "processing");
            // To Receive = shipped
            const toReceive = myOrders.filter(o => o.status === "shipped");
            // Completed = delivered
            const completed = myOrders.filter(o => o.status === "delivered");

            renderOrders("topay-section", toPay, "To Pay 💳");
            renderOrders("toship-section", toShip, "To Ship 📦");
            renderOrders("toreceive-section", toReceive, "To Receive 🚚");
            renderOrders("completed-section", completed, "Completed ⭐");
        }
    })
    .catch(err => console.warn("Could not load orders:", err));

    function renderOrders(sectionId, orders, title) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        if (orders.length === 0) {
            section.innerHTML = `<h2>${title}</h2><p style="color:#999; margin-top:10px;">No orders here yet.</p>`;
            return;
        }

        let html = `<h2>${title}</h2>`;
        orders.forEach(order => {
            html += `
                <div class="order-card" style="margin-top:15px;">
                    <div>
                        <strong>${order.shipping_address || "—"}</strong>
                        <p style="color:#999; font-size:13px;">₱${parseFloat(order.total_amount).toFixed(2)} · ${order.status}</p>
                    </div>
                    <div style="font-size:13px; color:#777;">${new Date(order.ordered_at).toLocaleDateString()}</div>
                </div>
            `;
        });
        section.innerHTML = html;
    }

    // ===========================
    // DARK MODE
    // ===========================
    const darkToggle = document.getElementById("darkToggle");
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.classList.toggle("dark", savedTheme === "dark");

    if (darkToggle) {
        darkToggle.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark");
            localStorage.setItem("theme", isDark ? "dark" : "light");
        });
    }

    // ===========================
    // SIDEBAR NAVIGATION
    // ===========================
    const menuLinks = document.querySelectorAll(".menu-link");
    const sections  = document.querySelectorAll(".page-section");

    function showSection(id) {
        sections.forEach(sec => {
            sec.style.display = sec.id === id ? "block" : "none";
        });
    }

    menuLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const target = link.getAttribute("data-target");
            menuLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
            showSection(target);
        });
    });

    // Status box clicks
    document.querySelectorAll(".status-box").forEach(box => {
        box.addEventListener("click", () => {
            const target = box.getAttribute("data-target");
            showSection(target);
            menuLinks.forEach(l => {
                if (l.getAttribute("data-target") === target) {
                    l.classList.add("active");
                } else {
                    l.classList.remove("active");
                }
            });
        });
    });

    showSection("profile-section");

    // ===========================
    // LOGOUT
    // ===========================
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (!confirm("Logout your account?")) return;
            localStorage.clear();
            window.location.href = "./HomePage.html";
        });
    }

    // ===========================
    // EDIT PROFILE
    // ===========================
    const editBtn       = document.getElementById("editProfileBtn");
    const modal         = document.getElementById("editModal");
    const closeBtn      = document.getElementById("closeModalBtn");
    const saveBtn       = document.getElementById("saveProfileBtn");
    const usernameInput = document.getElementById("usernameInput");
    const imageInput    = document.getElementById("imageInput");
    const usernameDisplay = document.querySelector(".user-info h2");
    const avatar        = document.querySelector(".avatar");

    // Load saved profile pic
    const savedImg = localStorage.getItem("profileImage");
    if (savedImg && avatar) avatar.src = savedImg;

    if (editBtn) {
        editBtn.addEventListener("click", () => {
            modal.style.display = "flex";
            usernameInput.value = usernameDisplay.textContent;
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const newName = usernameInput.value.trim();
            if (newName) {
                usernameDisplay.textContent = newName;
                localStorage.setItem("userName", newName);
            }
            if (imageInput.files && imageInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatar.src = e.target.result;
                    localStorage.setItem("profileImage", e.target.result);
                };
                reader.readAsDataURL(imageInput.files[0]);
            }
            modal.style.display = "none";
        });
    }
});
