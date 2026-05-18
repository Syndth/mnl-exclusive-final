/* ========== SIDEMENU ========== */
const sideMenu = document.querySelector('aside');
const menuBtn = document.querySelector('#menu_bar');
const closeBtn = document.querySelector('#close_btn');

menuBtn.addEventListener('click', () => {
    sideMenu.style.display = "block";
});

closeBtn.addEventListener('click', () => {
    sideMenu.style.display = "none";
});

/* ========== THEME TOGGLER ========== */
const themeToggler = document.querySelector('.theme-toggler');

themeToggler.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme-variables');

    themeToggler.querySelector('span:nth-child(1)').classList.toggle('active');
    themeToggler.querySelector('span:nth-child(2)').classList.toggle('active');
});

/* ========== LOGOUT BUTTON ========== */
document.getElementById("logoutBtn").addEventListener("click", function (event) {
    event.preventDefault();
    const confirmLogout = confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      alert("Logged out successfully!");
      window.location.href = "./logout.php";
    }
});

/* ======================================================
   ========== LOAD ORDERS FROM localStorage =============
   ====================================================== */

document.addEventListener("DOMContentLoaded", () => {
    let orders = JSON.parse(localStorage.getItem("allOrders")) || [];
    let table = document.getElementById("orderRows");

    if (!table) return; // para safe kung iba page nag load

    table.innerHTML = ""; // clear rows

    orders.forEach((order, index) => {
        const row = `
        <tr>
            <td>${order.name}</td>
            <td>${order.address}</td>
            <td>${order.item}</td>
            <td>${order.quantity}</td>
            <td>${order.total}</td>
            <td class="warning">${order.payment}</td>
            <td>
                <button class="btn-confirm" onclick="confirmOrder(${index})">Confirm</button>
                <button class="btn-reject" onclick="rejectOrder(${index})">Reject</button>
            </td>
        </tr>
        `;
        table.insertAdjacentHTML("beforeend", row);
    });
});

/* ========== HANDLE CONFIRM/REJECT ========== */
function confirmOrder(i) {
    const confirmMsg = confirm("Mark this order as Confirmed?");

    if (!confirmMsg) return;

    let orders = JSON.parse(localStorage.getItem("allOrders")) || [];

    // DELETE ORDER
    orders.splice(i, 1);

    // SAVE
    localStorage.setItem("allOrders", JSON.stringify(orders));

    // RELOAD
    location.reload();
}

function rejectOrder(i) {
    const confirmDel = confirm("Are you sure you want to reject this order?");

    if (!confirmDel) return;

    let orders = JSON.parse(localStorage.getItem("allOrders")) || [];

    // REMOVE ITEM SA ARRAY
    orders.splice(i, 1);

    // SAVE UPDATED LIST
    localStorage.setItem("allOrders", JSON.stringify(orders));

    // RELOAD TABLE
    location.reload();
}