const express = require("express");
const { getAdminDashboard, getAllBookings, approveBooking, rejectBooking } = require("../controllers/adminController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.get("/dashboard", authMiddleware, adminMiddleware, getAdminDashboard);

router.get("/bookings", authMiddleware, adminMiddleware, getAllBookings);
router.put("/approve/:id", authMiddleware, adminMiddleware, approveBooking);
router.put("/reject/:id", authMiddleware, adminMiddleware, rejectBooking);

module.exports = router;
