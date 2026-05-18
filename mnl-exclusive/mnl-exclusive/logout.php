<?php
session_start();
session_destroy();
?>
<script>
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    window.location.href = "./LoginPage.php";
</script>