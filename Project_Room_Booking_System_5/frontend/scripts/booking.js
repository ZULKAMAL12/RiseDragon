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

    if (!token) {
        alert("Unauthorized access! Please log in.");
        window.location.href = "../../index.html";
        return;
    }

    const timeSlots = [
        "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
        "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
    ];

    let selectedSlots = new Set();

    function formatDate(date) {
        return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
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
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return { start, end };
    }

    async function loadSchedule() {
        const roomId = roomSelect.value;
        if (!roomId) return;

        const { start, end } = getWeekRange(currentDate);
        weekRange.textContent = `${formatDate(start)} - ${formatDate(end)}`;

        try {
            const response = await fetch(`http://localhost:3000/api/booking/schedule?room=${roomId}&start=${formatDate(start)}&end=${formatDate(end)}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Failed to load schedule");

            const data = await response.json();
            scheduleTable.innerHTML = "";
            tableHeaders.innerHTML = "<th>Time</th>";

            for (let i = 0; i < 7; i++) {
                let day = new Date(start);
                day.setDate(day.getDate() + i);
                tableHeaders.innerHTML += `<th>${formatDate(day)}</th>`;
            }

            timeSlots.forEach(slot => {
                let row = `<td>${slot}</td>`;
                for (let i = 0; i < 7; i++) {
                    row += `<td class="slot available" onclick="toggleSlotSelection(this)">${data.bookings?.includes(slot) ? "Booked" : "Available"}</td>`;
                }
                scheduleTable.innerHTML += `<tr>${row}</tr>`;
            });
        } catch (error) {
            console.error("Error loading schedule:", error);
        }
    }

    prevWeekBtn.addEventListener("click", () => { currentDate.setDate(currentDate.getDate() - 7); loadSchedule(); });
    nextWeekBtn.addEventListener("click", () => { currentDate.setDate(currentDate.getDate() + 7); loadSchedule(); });

    roomSelect.addEventListener("change", loadSchedule);
    fetchRooms();
});
