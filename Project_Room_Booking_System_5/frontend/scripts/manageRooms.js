document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
        alert("Unauthorized access! Redirecting to login.");
        window.location.href = "../../index.html";
        return;
    }

    const roomList = document.getElementById("roomsTable");
    const addRoomForm = document.getElementById("addRoomForm");

    // ✅ Fetch and display all rooms
    async function loadRooms() {
        try {
            const response = await fetch("http://localhost:3000/api/rooms");
            const rooms = await response.json();
            roomList.innerHTML = "";

            rooms.forEach((room, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${room.name}</td>
                    <td>${room.type}</td>
                    <td><span class="badge bg-${room.status === "Available" ? "success" : "danger"}">${room.status}</span></td>
                    <td>
                        <button class="btn btn-${room.status === "Available" ? "warning" : "success"} btn-sm" 
                            onclick="toggleRoomStatus('${room._id}', '${room.status === "Available" ? "Maintenance" : "Available"}')">
                            ${room.status === "Available" ? "Disable" : "Enable"}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteRoom('${room._id}')">Delete</button>
                    </td>
                `;
                roomList.appendChild(row);
            });
        } catch (error) {
            console.error("Error loading rooms:", error);
            roomList.innerHTML = "<tr><td colspan='5'>Failed to load rooms</td></tr>";
        }
    }

    async function toggleRoomStatus(roomId, newStatus) {
        try {
            const response = await fetch(`http://localhost:3000/api/rooms/update/${roomId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const result = await response.json();
            alert(result.message);
            loadRooms();
        } catch (error) {
            console.error("Error updating room status:", error);
        }
    }

    async function deleteRoom(roomId) {
        if (!confirm("Are you sure you want to delete this room?")) return;

        try {
            const response = await fetch(`http://localhost:3000/api/rooms/delete/${roomId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            const result = await response.json();
            alert(result.message);
            loadRooms();
        } catch (error) {
            console.error("Error deleting room:", error);
        }
    }

    addRoomForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const name = document.getElementById("roomName").value.trim();
        const type = document.getElementById("roomType").value;

        try {
            const response = await fetch("http://localhost:3000/api/rooms/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, type, status: "Available" }),
            });

            const result = await response.json();
            alert(result.message);
            loadRooms();
        } catch (error) {
            console.error("Error adding room:", error);
        }
    });

    loadRooms();
});
