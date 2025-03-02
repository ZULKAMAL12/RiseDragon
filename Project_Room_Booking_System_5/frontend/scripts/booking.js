document.addEventListener("DOMContentLoaded", function () {
    const roomSelect = document.getElementById("roomSelect");
    const scheduleTable = document.getElementById("scheduleTable");
    const tableHeaders = document.getElementById("tableHeaders");
    const weekRange = document.getElementById("weekRange");

    const timeSlots = [
        "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
        "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"
    ];

    let currentDate = new Date();
    const MYT_OFFSET = 8 * 60 * 60 * 1000; // GMT+8

    function formatDate(date) {
        return new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
    }

    async function loadSchedule() {
        const room = roomSelect.value;
        const date = formatDate(currentDate);

        const response = await fetch(`http://localhost:3000/api/booking/schedule?room=${room}&date=${date}`);
        const data = await response.json();

        const bookings = data.bookings || [];

        scheduleTable.innerHTML = "";
        tableHeaders.innerHTML = "";

        // Table headers
        const timeHeader = document.createElement("th");
        timeHeader.textContent = "Time";
        tableHeaders.appendChild(timeHeader);

        const dateHeader = document.createElement("th");
        dateHeader.textContent = `${date} (Malaysia Time)`;
        tableHeaders.appendChild(dateHeader);

        timeSlots.forEach(slot => {
            const row = document.createElement("tr");
            const timeCell = document.createElement("td");
            timeCell.textContent = slot;
            row.appendChild(timeCell);

            const cell = document.createElement("td");
            cell.className = "slot available";
            cell.textContent = "Available";
            row.appendChild(cell);

            const isBooked = bookings.some(b => b.timeSlot === slot);
            if (isBooked) {
                cell.classList.remove("available");
                cell.classList.add("pending");
                cell.textContent = "Booked";
                cell.onclick = null;
            } else {
                cell.onclick = () => toggleSlotSelection(cell, slot);
            }

            scheduleTable.appendChild(row);
        });

        weekRange.textContent = `Booking Schedule for ${date}`;
    }

    function toggleSlotSelection(cell, timeSlot) {
        if (cell.classList.contains("pending")) return;

        if (cell.classList.contains("selected")) {
            cell.classList.remove("selected");
            cell.classList.add("available");
            cell.textContent = "Available";
        } else {
            cell.classList.remove("available");
            cell.classList.add("selected");
            cell.textContent = "Selected";
        }
    }

    async function confirmBooking() {
        const selectedSlots = Array.from(document.querySelectorAll(".selected")).map(cell => cell.textContent);
        if (!selectedSlots.length) {
            alert("No slots selected!");
            return;
        }

        const response = await fetch("http://localhost:3000/api/booking/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: localStorage.getItem("userId"),
                room: roomSelect.value,
                date: formatDate(currentDate),
                timeSlot: selectedSlots[0],
            }),
        });

        const result = await response.json();
        alert(result.message);
        loadSchedule();
    }

    roomSelect.addEventListener("change", loadSchedule);
    loadSchedule();
});
