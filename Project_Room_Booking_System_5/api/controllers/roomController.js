const Room = require("../models/Room");

// get room
const getRooms = async (req, res) => {
    try {
        console.log("Request Headers:", req.headers); // Debugging log

        const rooms = await Room.find();
        console.log("Rooms retrieved:", rooms); // Debugging log
        res.json(rooms);
    } catch (error) {
        console.error("❌ Error fetching rooms:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


// Add Room (Admin only)
const addRoom = async (req, res) => {
    try {
        const { name, type } = req.body;
        if (!name || !type) return res.status(400).json({ message: "Room name and type are required." });

        const newRoom = new Room({ name, type, status: "Available" });
        await newRoom.save();
        res.status(201).json({ message: "Room added successfully!", room: newRoom });
    } catch (error) {
        console.error("❌ Error adding room:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update Room (Admin only))
const updateRoomStatus = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: "Room not found" });

        room.status = room.status === "Available" ? "Maintenance" : "Available";
        await room.save();
        res.json({ message: `Room status updated to ${room.status}` });
    } catch (error) {
        console.error("❌ Error updating room status:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete Room (Admin only)
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ message: "Room not found" });

        res.json({ message: "Room deleted successfully!" });
    } catch (error) {
        console.error("❌ Error deleting room:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


module.exports = { getRooms, addRoom, updateRoomStatus, deleteRoom };
