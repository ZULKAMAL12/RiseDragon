const express = require("express");
const {
    getAdminDashboard,
    getAllBookings,
    approveBooking,
    rejectBooking
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// ✅ Admin Dashboard
router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboard);

// ✅ Get all bookings
router.get("/bookings", authMiddleware, adminMiddleware, getAllBookings);

// ✅ Approve & Reject Bookings
router.put("/approve/:id", authMiddleware, adminMiddleware, approveBooking);
router.put("/reject/:id", authMiddleware, adminMiddleware, rejectBooking);

// ✅ Handle Invalid Admin Routes
router.use((req, res) => {
    res.status(404).json({ message: "Admin API route not found" });
});

module.exports = router;
