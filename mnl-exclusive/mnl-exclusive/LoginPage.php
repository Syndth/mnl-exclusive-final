<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="CSS/stylelogin.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <title>Login - MNL Exclusive</title>
</head>
<body>

<header>
    <h1>MNL</h1>
    <h1 class="EX">EXCLUSIVE</h1>
    <nav>
        <ul>
            <li><a href="./HomePage.html">Home</a></li>
            <li><a href="./HomePage.html#about">About&nbsp;Us</a></li>
        </ul>
    </nav>
</header>

<div class="login-container">
    <h2>Login</h2>
    <form id="LoginForm">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Enter Password" required>

        <div class="showpass">
            <label>
                <input type="checkbox" onclick="togglePass()"> Show Password
            </label>
        </div>

        <div class="options">
            <label><input type="checkbox"> Remember Me</label>
            <a href="#">Forgot Password?</a>
        </div>

        <button type="submit" class="login-btn">Log In</button>
        <p class="create-link"><a href="./CreateAccount.php">Create Account</a></p>
        <button type="button" class="google-btn" onclick="alert('Google Sign in Coming Soon!')">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google Icon">
            Sign in with Google
        </button>
    </form>
</div>

<script>
function togglePass() {
    const pass = document.getElementById("password");
    pass.type = pass.type === "password" ? "text" : "password";
}

document.getElementById("LoginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please complete all fields.");
        return;
    }

    try {
        const response = await fetch("login_process.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
            // Save user info for use across the site
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userRole",   result.role);
            localStorage.setItem("userName",   result.userName);
            localStorage.setItem("userId",     result.userId);

            alert(result.role === "admin" ? "Welcome, Admin!" : "Login Successful!");
            window.location.href = result.redirect;
        } else {
            alert(result.message);
        }
    } catch (err) {
        alert("Something went wrong. Please try again.");
        console.error(err);
    }
});
</script>

<footer class="footer">
    <div class="footer-section terms">
        <h3>Terms and Condition</h3>
        <p>By using this website, you agree to our terms, which include accurate use of our site and products, understanding that prices and availability may change without notice, that all purchases are subject to confirmation, that returns are accepted within 7 days if items are unworn and in original condition, that all content including designs and images belong to Manila Exclusive, and may not be copied or used without permission, and that we are not liable for any damages resulting from use of this site or our products.</p>
    </div>
    <div class="footer-section Help">
        <h3>Help</h3>
        <a href="./faq.html">FAQ</a>
        <a href="./privacypolicy.html">Privacy Policy</a>
        <a href="./returnpolicy.html">Return Policy</a>
        <a href="./bulkorder.html">Bulk Order</a>
    </div>
    <div class="footer-section Follow">
        <h3>Follow Us</h3>
        <p>Tiktok : <a href="https://www.tiktok.com/@manilaexclusives2">@manilaexclusive2</a></p>
    </div>
    <div class="footer-section Contact">
        <h3>Contact Us</h3>
        <p>J.P. Rizal Extension, West Rembo, 1644 City of Taguig, Metro Manila, Philippines</p>
        <p>Email: <a href="mailto:manilaexclusive@gmail.com">manilaexclusive@gmail.com</a></p>
    </div>
</footer>

</body>
</html>
