const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const cors = require("cors");
const crypto = require("crypto"); // Add this line to require crypto
const app = express();
app.use(cors());
// Connect to MongoDB using the "master" database
mongoose
  .connect("mongodb://localhost:27017/master", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB using the "master" database'))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

app.use(express.json());

// Schema and model for users
const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  resetToken: String,
  resetTokenExpiry: Date,
});

const User = mongoose.model("User", userSchema);

// API to request password reset
app.post("/api/request-password-reset", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your-email@gmail.com",
      pass: "your-app-password", // Use an app-specific password for Gmail
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: user.email,
    subject: "Password Reset",
    text: `You requested a password reset. Click the link to reset: ${resetLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: "Error sending email" });
    }
    res.json({ message: "Reset link sent to your email" });
  });
});


app.listen(5000, () => console.log(`Server running on port ${PORT}`));
