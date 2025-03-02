const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: String, required: true },
    date: { type: String, required: true }, // Format: DD/MM/YYYY
    timeSlot: { type: String, required: true }, // Format: HH:mm AM/PM
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
