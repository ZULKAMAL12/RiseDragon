document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("register-form");

    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm_password").value;
        const isAdmin = document.getElementById("is_admin").checked;

        // Frontend Validation
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const data = { name, email, phone, password, isAdmin };

        try {
            const response = await fetch("http://localhost:3000/api/user/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.status === 201) {
                alert("Registration Successful!");
                window.location.href = "login.html"; // Redirect after success
            } else {
                alert(result.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Server error. Please try again.");
        }
    });
});
