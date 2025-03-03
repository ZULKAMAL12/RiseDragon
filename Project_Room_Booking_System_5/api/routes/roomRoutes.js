const express = require("express");
const { getRooms, addRoom, updateRoomStatus, deleteRoom } = require("../controllers/roomController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// ✅ Fetch all rooms (Users & Admins can access)
router.get("/", authMiddleware, getRooms);



// ✅ Add new room (Admin Only)
router.post("/add", authMiddleware, adminMiddleware, addRoom);

// ✅ Update room status (Admin Only)
router.put("/update/:id", authMiddleware, adminMiddleware, updateRoomStatus);

// ✅ Delete a room (Admin Only)
router.delete("/delete/:id", authMiddleware, adminMiddleware, deleteRoom);

module.exports = router;
