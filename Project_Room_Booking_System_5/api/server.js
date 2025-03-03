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
connectDB().then(() => {
    console.log("✅ MongoDB Connected Successfully");

    // Import Routes
    const authRoutes = require("./routes/authRoutes");
    const userRoutes = require("./routes/userRoutes");
    const adminRoutes = require("./routes/adminRoutes");
    const bookingRoutes = require("./routes/bookingRoutes");
    const roomRoutes = require("./routes/roomRoutes");

    // Use API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/booking", bookingRoutes);
    app.use("/api/rooms", roomRoutes);

    // Serve Static Frontend Files
    app.use(express.static(path.join(__dirname, "frontend")));

    // Handle unmatched API requests
    app.use("/api/*", (req, res) => {
        res.status(404).json({ message: "API route not found" });
    });

    // Serve `index.html` for any other frontend routes
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "frontend", "index.html"));
    });

    // Global Error Handling Middleware
    app.use((err, req, res, next) => {
        console.error("❌ Global Error:", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    });

    app.use((req, res, next) => {
        console.log(`🛑 Route Not Found: ${req.method} ${req.originalUrl}`);
        res.status(404).json({ message: "API route not found" });
    });
    

    // Start Server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}).catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
});
