document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.querySelector("form");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();
            console.log("🔍 Login API Response:", result); // Debugging

            if (response.ok) {
                localStorage.setItem("token", result.token);
                localStorage.setItem("role", result.role);
                console.log("✅ Token & Role Stored in LocalStorage");

                // Redirect based on role
                if (result.role === "admin") {
                    alert("Logging in as Admin...");
                    window.location.href = "../pages/admin/dashboard.html";
                } else {
                    alert("Logging in as User...");
                    window.location.href = "../pages/users/dashboard.html";
                }
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("❌ Error:", error);
            alert("Server error. Please try again.");
        }
    });
});
