const express = require("express");
const {
    getRoomSchedule,
    bookRoom,
    getUserBookings,
    cancelBooking,
    updateBooking
} = require("../controllers/bookingController");

const router = express.Router();

// Get room schedule (available & booked slots)
router.get("/schedule", getRoomSchedule);

// Book a room (User books a time slot)
router.post("/book", bookRoom);

// Get user's upcoming and past bookings
router.get("/userBookings", getUserBookings);

// Cancel a booking (removes slot availability & notifies admin)
router.post("/cancel", cancelBooking);

// Request to update a booking (Requires Admin approval)
router.post("/update", updateBooking);

module.exports = router;
