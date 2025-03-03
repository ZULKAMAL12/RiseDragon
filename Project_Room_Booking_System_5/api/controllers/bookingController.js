const Booking = require("../models/Booking");
const User = require("../models/User");
const Admin = require("../models/Admin");
const sendEmail = require("../utils/emailService");

// Fetch available and booked slots for a room
const getRoomSchedule = async (req, res) => {
    try {
        const { room, date } = req.query;

        if (!room || !date) {
            return res.status(400).json({ message: "Room ID and date are required." });
        }

        console.log(`🔍 Fetching schedule for Room: ${room} on Date: ${date}`);

        const bookings = await Booking.find({ room, date });
        res.json({ bookings });
    } catch (error) {
        console.error("❌ Error fetching schedule:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Book a room (Multiple Time Slots Supported) & Notify Admin
const bookRoom = async (req, res) => {
    try {
        const { userId, room, date, timeSlots } = req.body;

        if (!userId || !room || !date || !timeSlots || !timeSlots.length) {
            return res.status(400).json({ message: "Missing required fields: userId, room, date, timeSlots" });
        }

        console.log(`🔍 Checking availability for Room: ${room} on Date: ${date} for Slots: ${timeSlots}`);

        // Check if any of the selected time slots are already booked
        const existingBookings = await Booking.find({ room, date, timeSlot: { $in: timeSlots } });
        if (existingBookings.length > 0) {
            return res.status(400).json({ message: "One or more selected slots are already booked!" });
        }

        // Save multiple bookings
        const newBookings = timeSlots.map(slot => ({
            user: userId,
            room,
            date,
            timeSlot: slot,
            status: "Pending",
        }));

        await Booking.insertMany(newBookings);
        console.log("✅ Booking requests created successfully.");

        // Notify Admin
        const admins = await Admin.find();
        const adminEmails = admins.map(admin => admin.email);
        const emailBody = `A new booking request has been made for ${room} on ${date} at ${timeSlots.join(", ")}.
        Please review the booking for approval.`;

        try {
            await sendEmail(adminEmails, "New Room Booking Request", emailBody);
        } catch (emailError) {
            console.error("❌ Failed to send admin notification email:", emailError);
        }

        res.status(201).json({ message: "Booking request sent. Waiting for admin approval." });
    } catch (error) {
        console.error("❌ Error booking room:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get User's Upcoming & Past Bookings
const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.query || req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        console.log(`🔍 Fetching bookings for User ID: ${userId}`);

        const upcomingBookings = await Booking.find({ user: userId, status: { $ne: "Completed" } }).sort("date timeSlot");
        const bookingHistory = await Booking.find({ user: userId, status: "Completed" }).sort("-date -timeSlot");

        res.json({ upcoming: upcomingBookings, history: bookingHistory });
    } catch (error) {
        console.error("❌ Error fetching user bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Cancel Booking
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required" });
        }

        const deletedBooking = await Booking.findByIdAndDelete(bookingId);
        if (!deletedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json({ message: "Booking canceled successfully!" });
    } catch (error) {
        console.error("❌ Error canceling booking:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Update Booking Request (Requires Admin Approval)
const updateBooking = async (req, res) => {
    try {
        const { bookingId, newTime } = req.body;

        if (!bookingId || !newTime) {
            return res.status(400).json({ message: "Booking ID and new time slot are required" });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { timeSlot: newTime, status: "Pending" },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json({ message: "Booking update request sent for admin approval." });
    } catch (error) {
        console.error("❌ Error updating booking:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Export all functions
module.exports = { getRoomSchedule, bookRoom, getUserBookings, cancelBooking, updateBooking };
