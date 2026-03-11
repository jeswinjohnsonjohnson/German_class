const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  level: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Booking", bookingSchema);