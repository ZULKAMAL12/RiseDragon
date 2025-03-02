const Booking = require("../models/Booking");
const User = require("../models/User");
const Admin = require("../models/Admin");
const sendEmail = require("../utils/emailService");

// Fetch available and booked slots for a room
const getRoomSchedule = async (req, res) => {
    try {
        const { room, date } = req.query;

        // Find all bookings for this room and date
        const bookings = await Booking.find({ room, date });

        res.json({ bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// Book a room and notify admin
const bookRoom = async (req, res) => {
    try {
        const { userId, room, date, timeSlot } = req.body;

        // Check if slot is already booked
        const existingBooking = await Booking.findOne({ room, date, timeSlot });
        if (existingBooking) return res.status(400).json({ message: "Slot already booked!" });

        // Save booking as Pending
        const newBooking = new Booking({ user: userId, room, date, timeSlot, status: "Pending" });
        await newBooking.save();

        // Get admin emails
        const admins = await Admin.find();
        const adminEmails = admins.map(admin => admin.email);

        // Notify Admin
        const emailBody = `A new booking request has been made for ${room} on ${date} at ${timeSlot}.
        Please review the booking for approval.`;

        try {
            await sendEmail(adminEmails, "New Room Booking Request", emailBody);
        } catch (emailError) {
            console.error("❌ Failed to send admin notification email:", emailError);
        }

        res.status(201).json({ message: "Booking request sent. Waiting for admin approval." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET User's Upcoming & Past Bookings
const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.query;
        const upcomingBookings = await Booking.find({ user: userId, status: { $ne: "Completed" } });
        const bookingHistory = await Booking.find({ user: userId, status: "Completed" });

        res.json({ upcoming: upcomingBookings, history: bookingHistory });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// CANCEL Booking
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        await Booking.findByIdAndDelete(bookingId);

        res.json({ message: "Booking canceled successfully!" });
    } catch (error) {
        console.error("Error canceling booking:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// UPDATE Booking Request (Requires Admin Approval)
const updateBooking = async (req, res) => {
    try {
        const { bookingId, newTime } = req.body;
        await Booking.findByIdAndUpdate(bookingId, { timeSlot: newTime, status: "Pending" });

        res.json({ message: "Booking update request sent for admin approval." });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getRoomSchedule, bookRoom,getUserBookings, cancelBooking, updateBooking };
