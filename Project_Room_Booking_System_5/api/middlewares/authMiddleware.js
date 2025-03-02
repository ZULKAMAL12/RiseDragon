const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");

    // Check if token exists
    if (!token) {
        return res.status(401).json({ message: "Access Denied: No token provided" });
    }

    try {
        // Verify JWT Token
        const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = verified; // Attach user data to request object
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

module.exports = authMiddleware;
