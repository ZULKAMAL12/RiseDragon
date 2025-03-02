const nodemailer = require("nodemailer");
require("dotenv").config();

// Email sender setup
const transporter = nodemailer.createTransport({
    service: "gmail", // Change to your email provider (e.g., Outlook, SMTP server)
    auth: {
        user: process.env.EMAIL_USER, // Email from .env file
        pass: process.env.EMAIL_PASS, // App Password (NOT your real password)
    },
});

// Send Email Function
const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });

        console.log(`✅ Email sent to ${to}`);
    } catch (error) {
        console.error("❌ Email failed to send:", error);
    }
};

module.exports = sendEmail;
