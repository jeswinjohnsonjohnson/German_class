require("dotenv").config();

/* FIX: force IPv4 instead of IPv6 (important for Railway) */
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const User = require("./models/User");
const Booking = require("./models/Booking");

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- EMAIL SETUP ---------------- */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* Check SMTP connection when server starts */

transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP ERROR:", error);
  } else {
    console.log("SMTP READY: Gmail server connected");
  }
});

/* ---------------- DATABASE ---------------- */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error(err));

/* ---------------- USERS ---------------- */

// LOGIN
app.post("/users/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });

    if (!user || user.password !== password)
      return res.status(400).json({ message: "Invalid email or password" });

    res.json({
      id: user._id,
      email: user.email,
      level: user.level
    });

  } catch (err) {

    res.status(500).json({ message: "Login error" });

  }

});

// GET USERS
app.get("/users", async (req, res) => {

  try {

    const users = await User.find();
    res.json(users);

  } catch (err) {

    res.status(500).json({ message: "Error fetching users" });

  }

});

// CREATE USER
app.post("/users", async (req, res) => {

  try {

    const { email, password, level } = req.body;

    if (!email || !password || !level)
      return res.status(400).json({
        message: "Email, password and level required"
      });

    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({
        message: "User already exists"
      });

    const user = new User({ email, password, level });

    await user.save();

    res.status(201).json(user);

  } catch (err) {

    res.status(500).json({
      message: "Error creating user"
    });

  }

});

// UPDATE USER
app.put("/users/:id", async (req, res) => {

  try {

    const { email, password, level } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { email, password, level },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);

  } catch (err) {

    res.status(500).json({ message: "Error updating user" });

  }

});

// DELETE USER
app.delete("/users/:id", async (req, res) => {

  try {

    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });

  } catch (err) {

    res.status(500).json({ message: "Error deleting user" });

  }

});

/* ---------------- BOOKINGS ---------------- */

// GET BOOKINGS
app.get("/bookings", async (req, res) => {

  try {

    const bookings = await Booking.find();
    res.json(bookings);

  } catch (err) {

    res.status(500).json({
      message: "Error fetching bookings"
    });

  }

});

// CREATE BOOKING
app.post("/bookings", async (req, res) => {

  try {

    const { username, email, level, date, time } = req.body;

    if (!email || !level || !date || !time)
      return res.status(400).json({
        message: "Email, level, date, and time required"
      });

    const existingBooking = await Booking.findOne({ date, time });

    if (existingBooking)
      return res.status(400).json({
        message: "Slot already booked"
      });

    const booking = new Booking({

      username: username || email.split("@")[0],
      email,
      level,
      date,
      time

    });

    await booking.save();

    /* SEND EMAIL */

    try {

      await transporter.sendMail({

        from: process.env.EMAIL_USER,
        to: email,
        subject: "Booking Confirmation",
        text: `Hi ${booking.username}, your booking is confirmed on ${date} at ${time}`

      });

      console.log("Email sent");

    } catch (mailError) {

      console.log("Email failed but booking saved:", mailError);

    }

    res.status(201).json({
      message: "Booking created",
      booking
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Error creating booking"
    });

  }

});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});