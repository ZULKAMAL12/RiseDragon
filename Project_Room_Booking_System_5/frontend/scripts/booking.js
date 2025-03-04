document.addEventListener("DOMContentLoaded", function () {
    const roomSelect = document.getElementById("roomSelect");
    const scheduleTable = document.getElementById("scheduleTable");
    const tableHeaders = document.getElementById("tableHeaders");
    const weekRange = document.getElementById("weekRange");
    const confirmBookingBtn = document.getElementById("confirmBookingBtn");
    const prevWeekBtn = document.getElementById("prevWeekBtn");
    const nextWeekBtn = document.getElementById("nextWeekBtn");

    const token = localStorage.getItem("token");
    let currentDate = new Date();
    let selectedSlots = new Set();

    if (!token) {
        alert("Unauthorized access! Please log in.");
        window.location.href = "../../index.html";
        return;
    }

    // Time slots displayed to users (must match what's stored in your DB)
    const timeSlots = [
        "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
        "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
    ];

    // Format date as DD/MM/YYYY
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    async function fetchRooms() {
        try {
            const response = await fetch("http://localhost:3000/api/rooms", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Failed to fetch rooms");

            const rooms = await response.json();
            roomSelect.innerHTML = `<option value="">Select a Room</option>`;
            rooms.forEach(room => {
                const option = document.createElement("option");
                option.value = room._id;
                option.textContent = `${room.name} (${room.type})`;
                roomSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    }

    function getWeekRange(date) {
        // Start the week on Sunday
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());

        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start, end };
    }

    async function loadSchedule() {
        const roomId = roomSelect.value;
        if (!roomId) return;

        const currentUserId = localStorage.getItem("userId");
        const { start, end } = getWeekRange(currentDate);
        weekRange.textContent = `${formatDate(start)} - ${formatDate(end)}`;

        try {
            const response = await fetch(
                `http://localhost:3000/api/booking/schedule?room=${roomId}&start=${formatDate(start)}&end=${formatDate(end)}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error("Failed to load schedule");

            const data = await response.json();
            console.log("Schedule data from server:", data);

            scheduleTable.innerHTML = "";
            tableHeaders.innerHTML = "<th>Time</th>";

            // Create headers for each day (DD/MM/YYYY)
            for (let i = 0; i < 7; i++) {
                let day = new Date(start);
                day.setDate(day.getDate() + i);
                tableHeaders.innerHTML += `<th>${formatDate(day)}</th>`;
            }

            // Build table rows for each time slot
            timeSlots.forEach(slot => {
                let row = `<td>${slot}</td>`;
                for (let i = 0; i < 7; i++) {
                    let day = new Date(start);
                    day.setDate(day.getDate() + i);
                    let formattedDay = formatDate(day);

                    // Look for an existing booking with this date + time
                    const existingBooking = data.bookings.find(
                        b => b.date === formattedDay && b.timeSlot === slot
                    );

                    let statusClass = "available";
                    let statusText = "Available";

                    if (existingBooking) {
                        // Compare the booking's user to the current user
                        const bookingUserId = existingBooking.user?.toString();
                        if (existingBooking.status === "Pending") {
                            if (bookingUserId === currentUserId) {
                                statusClass = "your-pending";
                                statusText = "Your Pending";
                            } else {
                                statusClass = "pending";
                                statusText = "Pending";
                            }
                        } else {
                            // For "Approved" or "Rejected", or any other status
                            if (bookingUserId === currentUserId) {
                                statusClass = "your-booked";
                                statusText = "Your Booked";
                            } else {
                                statusClass = "booked";
                                statusText = "Booked";
                            }
                        }
                    }

                    row += `
                      <td class="slot ${statusClass}"
                          data-time="${slot}"
                          data-date="${formattedDay}">
                          ${statusText}
                      </td>
                    `;
                }
                scheduleTable.innerHTML += `<tr>${row}</tr>`;
            });

            addSlotClickEvent();
        } catch (error) {
            console.error("Error loading schedule:", error);
        }
    }

    function addSlotClickEvent() {
        document.querySelectorAll(".slot").forEach(cell => {
            cell.addEventListener("click", function () {
                toggleSlotSelection(this);
            });
        });
    }

    function toggleSlotSelection(cell) {
        // Don't allow selection if it's already booked/pending
        if (
            cell.classList.contains("booked") ||
            cell.classList.contains("pending") ||
            cell.classList.contains("your-booked") ||
            cell.classList.contains("your-pending")
        ) {
            return;
        }

        const date = cell.getAttribute("data-date");
        const timeSlot = cell.getAttribute("data-time");
        const slotKey = `${date} - ${timeSlot}`;

        if (selectedSlots.has(slotKey)) {
            // Deselect
            selectedSlots.delete(slotKey);
            cell.classList.remove("selected");
            cell.classList.add("available");
            cell.textContent = "Available";
        } else {
            // Select
            selectedSlots.add(slotKey);
            cell.classList.remove("available");
            cell.classList.add("selected");
            cell.textContent = "Selected";
        }
    }

    async function confirmBooking() {
        if (selectedSlots.size === 0) {
            alert("No slots selected!");
            return;
        }

        const roomId = roomSelect.value;
        const userId = localStorage.getItem("userId");
        if (!roomId || !userId) {
            alert("Invalid booking details. Please try again.");
            return;
        }

        // Build an array of { date, timeSlot } objects
        const bookingSlots = Array.from(selectedSlots).map(slotKey => {
            // slotKey is "DD/MM/YYYY - HH:mm AM/PM"
            const [datePart, timePart] = slotKey.split(" - ");
            return {
                date: datePart.trim(),
                timeSlot: timePart.trim()
            };
        });

        // Show a confirmation message listing each selected slot
        const roomName = roomSelect.options[roomSelect.selectedIndex].text;
        const bookingDetails = bookingSlots
            .map(b => `• ${b.date} at ${b.timeSlot}`)
            .join("\n");

        const confirmationMessage = `Please confirm your booking details:\n\nRoom: ${roomName}\nSlots:\n${bookingDetails}\n\nDo you want to proceed?`;
        const confirmation = window.confirm(confirmationMessage);
        if (!confirmation) return;

        // This matches the new controller's expected payload { userId, room, bookings }
        const bookingData = {
            userId: userId,
            room: roomId,
            bookings: bookingSlots
        };

        console.log("📌 Booking Data Sent:", bookingData);

        try {
            const response = await fetch("http://localhost:3000/api/booking/book", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("❌ Booking Error:", errorData);
                throw new Error(errorData.message || "Booking failed");
            }

            const result = await response.json();
            alert(result.message);
            selectedSlots.clear();  // Clear selection after booking
            loadSchedule();         // Refresh to see pending/approved statuses
        } catch (error) {
            console.error("❌ Error confirming booking:", error);
            alert("Booking failed. Please try again.");
        }
    }

    prevWeekBtn.addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() - 7);
        loadSchedule();
    });

    nextWeekBtn.addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() + 7);
        loadSchedule();
    });

    confirmBookingBtn.addEventListener("click", confirmBooking);
    roomSelect.addEventListener("change", loadSchedule);
    fetchRooms();
});
