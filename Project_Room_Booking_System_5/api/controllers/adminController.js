const Booking = require("../models/Booking");
const Room = require("../models/Room");
const User = require("../models/User");
const sendEmail = require("../utils/emailService");
const mongoose = require("mongoose");

// ✅ ADMIN DASHBOARD DATA
const getAdminDashboard = async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const totalUsers = await User.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: "Pending" });
        const confirmedBookings = await Booking.countDocuments({ status: "Confirmed" });

        res.json({ totalRooms, totalUsers, pendingBookings, confirmedBookings });
    } catch (error) {
        console.error("❌ Error fetching admin dashboard data:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// ✅ GET ALL BOOKINGS (FOR ADMIN)
const getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user", "name email") // Only get required user fields
            .populate("room", "name"); // Ensure `Room` model has correct reference

        res.json(bookings);
    } catch (error) {
        console.error("❌ Error fetching all bookings:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// ✅ APPROVE BOOKING
const approveBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Booking ID" });
        }

        const booking = await Booking.findById(id).populate("user", "email");
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        booking.status = "Confirmed"; // ✅ Match frontend status values
        await booking.save();

        // Send email notification
        if (booking.user?.email) {
            try {
                await sendEmail(
                    booking.user.email,
                    "Booking Approved",
                    `Your booking for ${booking.room.name} on ${booking.date} at ${booking.timeSlot} has been approved.`
                );
            } catch (emailError) {
                console.error("⚠️ Email notification failed:", emailError.message);
            }
        }

        res.json({ message: "Booking approved successfully" });
    } catch (error) {
        console.error("❌ Error approving booking:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};

// ✅ REJECT BOOKING
const rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Booking ID" });
        }

        const booking = await Booking.findById(id).populate("user", "email");
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        booking.status = "Rejected"; // ✅ Match frontend status values
        await booking.save();

        // Send email notification
        if (booking.user?.email) {
            try {
                await sendEmail(
                    booking.user.email,
                    "Booking Rejected",
                    `Your booking for ${booking.room.name} on ${booking.date} at ${booking.timeSlot} has been rejected.`
                );
            } catch (emailError) {
                console.error("⚠️ Email notification failed:", emailError.message);
            }
        }

        res.json({ message: "Booking rejected successfully" });
    } catch (error) {
        console.error("❌ Error rejecting booking:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getAdminDashboard, getAllBookings, approveBooking, rejectBooking };
