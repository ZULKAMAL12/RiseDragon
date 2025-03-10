const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user", enum: ["user"] } 
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema, "users"); // Store in "users" collection
