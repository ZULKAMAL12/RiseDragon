document.addEventListener("DOMContentLoaded", async function () {
    const upcomingTable = document.getElementById("upcomingBookings");
    const historyTable = document.getElementById("bookingHistory");

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    console.log("Stored Role:", role); // Debugging Log
    console.log("Stored Token:", token ? "Exists" : "Not Found"); // Debugging Log

    if (!token || !role || role.trim().toLowerCase() !== "user") {
        alert("Unauthorized access! Redirecting to login.");
        logout();
        return;
    }

    async function fetchBookings() {
        try {
            const response = await fetch("http://localhost:3000/api/booking/userBookings", {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch bookings");

            const { upcoming, history } = await response.json();
            console.log("Fetched Bookings:", { upcoming, history }); // Debugging Log

            renderBookings(upcoming, "upcomingBookings", true);
            renderBookings(history, "bookingHistory", false);
        } catch (error) {
            console.error("❌ Error fetching bookings:", error);
            alert("Failed to load bookings. Please try again.");
        }
    }

    function renderBookings(bookings, tableId, isUpcoming) {
        const tableBody = document.getElementById(tableId);
        tableBody.innerHTML = "";

        if (bookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No bookings found.</td></tr>`;
            return;
        }

        bookings.forEach((booking, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${booking.room}</td>
                <td>${booking.date}</td>
                <td>${booking.timeSlot}</td>
                <td><span class="badge bg-${getStatusColor(booking.status)}">${booking.status}</span></td>
                <td>${isUpcoming && (booking.status === "Pending" || booking.status === "Confirmed") ? `
                    <button class="btn btn-danger btn-sm" onclick="cancelBooking('${booking._id}')">Cancel</button>
                    <button class="btn btn-warning btn-sm" onclick="updateBooking('${booking._id}')">Update</button>
                ` : ""}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function getStatusColor(status) {
        switch (status.toLowerCase()) {
            case "pending": return "warning";
            case "confirmed": return "success";
            case "completed": return "secondary";
            case "rejected": return "danger";
            default: return "dark";
        }
    }

    async function cancelBooking(bookingId) {
        if (!confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/booking/cancel`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ bookingId }) // Removed userId (Backend should verify from token)
            });

            const result = await response.json();
            alert(result.message);
            fetchBookings(); // Refresh bookings after cancellation
        } catch (error) {
            console.error("❌ Error cancelling booking:", error);
            alert("Failed to cancel booking. Please try again.");
        }
    }

    async function updateBooking(bookingId) {
        const newDate = prompt("Enter new date (YYYY-MM-DD):");
        const newTime = prompt("Enter new time slot (e.g., 10:00 AM - 12:00 PM):");

        if (!newDate || !newTime) {
            alert("Update canceled.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/booking/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ bookingId, newDate, newTime }) // Removed userId (Backend should verify from token)
            });

            const result = await response.json();
            alert(result.message);
            fetchBookings(); // Refresh bookings after update request
        } catch (error) {
            console.error("❌ Error updating booking:", error);
            alert("Failed to update booking. Please try again.");
        }
    }

    function logout() {
        console.warn("Logging out user..."); // Debugging Log
        localStorage.clear();
        window.location.href = "../../index.html";
    }

    fetchBookings();
});
