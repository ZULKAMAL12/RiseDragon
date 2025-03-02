document.addEventListener("DOMContentLoaded", async function () {
    const upcomingTable = document.getElementById("upcomingBookings");
    const historyTable = document.getElementById("bookingHistory");

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
        alert("Unauthorized access! Please log in.");
        window.location.href = "../../index.html";
        return;
    }

    async function fetchBookings() {
        try {
            const response = await fetch(`http://localhost:3000/api/booking/userBookings?userId=${userId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to fetch bookings");

            const { upcoming, history } = await response.json();

            renderBookings(upcoming, "upcomingBookings", true);
            renderBookings(history, "bookingHistory", false);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            alert("Failed to load bookings. Please try again.");
        }
    }

    function renderBookings(bookings, tableId, isUpcoming) {
        const tableBody = document.getElementById(tableId);
        tableBody.innerHTML = "";

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
        return status === "Pending" ? "warning" : status === "Confirmed" ? "success" : "secondary";
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
                body: JSON.stringify({ bookingId })
            });

            const result = await response.json();
            alert(result.message);
            fetchBookings(); // Refresh bookings after cancellation
        } catch (error) {
            console.error("Error cancelling booking:", error);
            alert("Failed to cancel booking. Please try again.");
        }
    }

    async function updateBooking(bookingId) {
        const newDate = prompt("Enter new date (DD/MM/YYYY):");
        const newTime = prompt("Enter new time slot (e.g., 10:00 AM):");

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
                body: JSON.stringify({ bookingId, userId, newDate, newTime })
            });

            const result = await response.json();
            alert(result.message);
            fetchBookings(); // Refresh bookings after update request
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("Failed to update booking. Please try again.");
        }
    }

    fetchBookings();
});
