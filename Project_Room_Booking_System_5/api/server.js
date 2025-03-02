const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
                styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'", "http://localhost:3000"],
            },
        },
    })
);

// Connect to MongoDB
(async () => {
    try {
        await connectDB();
        console.log("✅ MongoDB Connected Successfully");

        // Import Routes
        const userRoutes = require("./routes/userRoutes");
        const adminRoutes = require("./routes/adminRoutes");
        const bookingRoutes = require("./routes/bookingRoutes");
        const authRoutes = require("./routes/authRoutes");

        // Use Routes
        app.use("/api/auth", authRoutes);
        app.use("/api/user", userRoutes);
        app.use("/api/admin", adminRoutes);
        app.use("/api/booking", bookingRoutes);

        // Serve Static Frontend Files
        app.use(express.static(path.join(__dirname, "frontend")));

        // Serve index.html for unmatched frontend routes
        app.get("*", (req, res) => {
            res.sendFile(path.join(__dirname, "frontend", "index.html"));
        });

        // Global Error Handling Middleware
        app.use((err, req, res, next) => {
            console.error("❌ Global Error:", err.message);
            res.status(500).json({ message: "Internal Server Error" });
        });

        // Start Server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
})();
