const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, default: function() { return this.email.split("@")[0]; } }, // default to email prefix
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level: { type: String, enum: ["A1","A2","B1","B2","C1","C2"], default: "A1" }
});

module.exports = mongoose.model("User", userSchema);