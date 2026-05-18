const faqs = document.querySelectorAll(".faq");

        faqs.forEach(faq => {
            const question = faq.querySelector(".question");
            const answer = faq.querySelector(".answer");

            question.addEventListener("click", () => {
                if (faq.classList.contains("active")) {
                    // CLOSE
                    answer.style.maxHeight = null;
                    faq.classList.remove("active");
                } else {
                    // CLOSE all others (optional - delete if you want multiple open)
                    faqs.forEach(f => {
                        f.classList.remove("active");
                        f.querySelector(".answer").style.maxHeight = null;
                    });

                    // OPEN current
                    faq.classList.add("active");
                    answer.style.maxHeight = answer.scrollHeight + "px";
                }
            });
        });
        document.getElementById("profileBtn").addEventListener("click", function (e) {
    e.preventDefault();

    // Check kung may account na naka-login
    if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "./Profile.html"; 
    } else {
        window.location.href = "./LoginPage.html";
    }
});