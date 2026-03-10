const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Mailgun = require("mailgun.js");
const formData = require("form-data");
const User = require("./models/User");
const Booking = require("./models/Booking");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Mailgun setup
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
});

// -------- USERS -------- //

// Login
app.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

  res.json({
  id: user._id,
  username: user.username,
  email: user.email,
  level: user.level,
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Create a new user
app.post("/users", async (req, res) => {
  try {
    const { email, password, level } = req.body;

    if (!email || !password || !level) {
      return res.status(400).json({ message: "Email, password, and level are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const user = new User({ email, password, level });
    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
});

// Update user
app.put("/users/:id", async (req, res) => {
  try {
    const { email, password, level } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { email, password, level },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user" });
  }
});

// Delete user
app.delete("/users/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting user" });
  }
});

// -------- BOOKINGS -------- //

// Get all bookings
app.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

app.post("/bookings", async (req, res) => {
  try {
    const { email, level, date, time } = req.body;

    if (!email || !level || !date || !time) {
      return res.status(400).json({ message: "Email, level, date, and time required" });
    }

    const existingBooking = await Booking.findOne({ date, time });
    if (existingBooking) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // Get username from Users collection
    const user = await User.findOne({ email });

    const booking = new Booking({
      username: user ? user.username : email.split("@")[0],
      email,
      level,
      date,
      time
    });

    await booking.save();

    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: `Flock International <${process.env.EMAIL_FROM}>`,
      to: [email],
      subject: "Booking Confirmation",
      text: `Hi ${booking.username},\nYour booking is confirmed on ${date} at ${time}, Level: ${level}`,
    });

    res.status(201).json(booking);

  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({
      message: "Error creating booking",
      error: err.message,
    });
  }
});

// Update booking
app.put("/bookings/:id", async (req, res) => {
  try {
    const { username, email, level, date, time } = req.body;

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        username: username || email.split("@")[0],
        email,
        level,
        date,
        time,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating booking" });
  }
});

// Delete booking
app.delete("/bookings/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting booking" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));