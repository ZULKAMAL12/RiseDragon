const User = require("../models/User");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/emailService");
const jwt = require("jsonwebtoken");

// REGISTER A NEW USER OR ADMIN
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password, isAdmin } = req.body;

        // Ensure role is assigned correctly
        const role = Boolean(isAdmin) ? "admin" : "user"; 

        // Check if the email already exists 
        const userExists = await User.findOne({ email }) || await Admin.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // Hash password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        let newUser;
        if (role === "admin") {
            newUser = new Admin({
                name,
                email,
                phone,
                password: hashedPassword,
                role, // Store role explicitly in DB
            });
        } else {
            newUser = new User({
                name,
                email,
                phone,
                password: hashedPassword,
                role, // Store role explicitly in DB
            });
        }

        await newUser.save();

        // Attempt to send email, but allow failure
        try {
            await sendEmail(email, "Welcome!", `Hi ${name}, your account has been created as a ${role}.`);
        } catch (emailError) {
            console.error("❌ Email sending failed:", emailError.message);
        }

        res.status(201).json({ message: `Registration successful as ${role}` });
    } catch (error) {
        console.error("❌ Registration error:", error.stack);
        res.status(500).json({ message: "Server Error" });
    }
};

// LOGIN USER OR ADMIN
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        let role = "user"; // Default role

        // If user not found, check in admin collection
        if (!user) {
            user = await Admin.findOne({ email });
            role = "admin"; 
        }

        // If no user/admin found
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare input password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Ensure role is stored in DB
        if (!user.role) {
            return res.status(500).json({ message: "Role is missing in the database!" });
        }

        // Generate JWT token include role
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Ensure role is included
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.status(200).json({ token, userId: user._id, role: user.role });
    } catch (error) {
        console.error("❌ Login error:", error.stack);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { registerUser, loginUser };
