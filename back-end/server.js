const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const User = require("./models/User");
const Booking = require("./models/Booking");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// -------- USERS -------- //

app.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // Plain text password comparison
    if (password !== user.password)
      return res.status(400).json({ message: "Invalid email or password" });

    res.json({
      username: user.username,
      email: user.email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error" });
  }
});
// -------- BOOKINGS -------- //

// Get all bookings (normalized)
app.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find();

    const cleaned = bookings.map(b => ({
      _id: b._id,
      username: typeof b.username === "string" ? b.username : (b.email || "Unknown"),
      email: typeof b.email === "string" ? b.email : "unknown@test.com",
      level: b.level,
      date: b.date,
      time: b.time
    }));

    res.json(cleaned);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// Create booking
app.post("/bookings", async (req, res) => {
  try {
    const { username, email, level, date, time } = req.body;
    if (!username || !email || !level || !date || !time)
      return res.status(400).json({ message: "All fields required" });

    // Weekly limit: 3 bookings per email
    const d = new Date(date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekBookings = await Booking.find({
      email,
      date: { $gte: monday.toISOString().split("T")[0], $lte: sunday.toISOString().split("T")[0] }
    });

    if (weekBookings.length >= 3)
      return res.status(400).json({ message: "You can only book 3 days per week" });

    // Check slot availability
    const existingBooking = await Booking.findOne({ date, time });
    if (existingBooking)
      return res.status(400).json({ message: "Slot already booked" });

    const booking = new Booking({ username, email, level, date, time });
    await booking.save();

    // Send email confirmation
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Booking Confirmation",
      text: `Hi ${username},\n\nYour booking is confirmed:\nDate: ${date}\nTime: ${time}\nLevel: ${level}\n\nThank you!`
    });

    res.status(201).json({ message: "Booking saved and email sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving booking or sending email" });
  }
});

// Delete booking
app.delete("/bookings/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting booking" });
  }
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));