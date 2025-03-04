const Booking = require("../models/Booking");
const User = require("../models/User");
const Admin = require("../models/Admin");
const sendEmail = require("../utils/emailService");

// Fetch available and booked slots for a room
const getRoomSchedule = async (req, res) => {
  try {
    const { room, start, end } = req.query;
    if (!room || !start || !end) {
      return res.status(400).json({ message: "Missing required parameters: room, start, end" });
    }
    console.log(`Fetching schedule for Room: ${room}, From: ${start}, To: ${end}`);
    // Note: With DD/MM/YYYY, lexicographical comparisons may not work as intended.
    // Ensure that the provided start and end dates are correct, or convert them to comparable values.
    const bookings = await Booking.find({
      room,
      date: { $gte: start, $lte: end }
    });
    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching room schedule:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Book a room (Multiple Time Slots Supported across different dates) & Notify Admin
const bookRoom = async (req, res) => {
  try {
    // Expecting a payload with a "bookings" array; each booking object should include a date and a timeSlot.
    const { userId, room, bookings } = req.body;
    if (!userId || !room || !bookings || !Array.isArray(bookings) || bookings.length === 0) {
      return res.status(400).json({ message: "Missing required fields: userId, room, bookings" });
    }
    
    // Validate each booking object
    for (const booking of bookings) {
      if (!booking.date || !booking.timeSlot) {
        return res.status(400).json({ message: "Each booking must include a date and timeSlot" });
      }
    }
    
    console.log(`Checking availability for Room: ${room} for bookings: ${JSON.stringify(bookings)}`);
    
    // Build an $or query to check if any requested slot is already booked
    const orConditions = bookings.map(b => ({ date: b.date, timeSlot: b.timeSlot }));
    const existingBookings = await Booking.find({ room, $or: orConditions });
    if (existingBookings.length > 0) {
      return res.status(400).json({ message: "One or more selected slots are already booked!" });
    }
    
    // Create new booking documents for each requested slot
    const newBookings = bookings.map(b => ({
      user: userId,
      room,
      date: b.date,
      timeSlot: b.timeSlot,
      status: "Pending",
    }));
    await Booking.insertMany(newBookings);
    console.log("Booking requests created successfully.");
    
    // Notify Admin
    const admins = await Admin.find();
    const adminEmails = admins.map(admin => admin.email);
    const emailBody = `A new booking request has been made for Room: ${room} with the following details:\n` +
                      bookings.map(b => `Date: ${b.date}, Time: ${b.timeSlot}`).join("\n") +
                      `\n\nPlease review the booking for approval.`;
    try {
      await sendEmail(adminEmails, "New Room Booking Request", emailBody);
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
    }
    
    res.status(201).json({ message: "Booking request sent. Waiting for admin approval." });
  } catch (error) {
    console.error("Error booking room:", error);
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
    console.log(`Fetching bookings for User ID: ${userId}`);
    const upcomingBookings = await Booking.find({ user: userId, status: { $ne: "Completed" } }).sort("date timeSlot");
    const bookingHistory = await Booking.find({ user: userId, status: "Completed" }).sort("-date -timeSlot");
    res.json({ upcoming: upcomingBookings, history: bookingHistory });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
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
    console.error("Error canceling booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Booking Request (Requires Admin Approval)
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
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getRoomSchedule, bookRoom, getUserBookings, cancelBooking, updateBooking };
