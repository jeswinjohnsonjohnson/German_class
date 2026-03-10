const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: String,
  url: String,
  level: String
});

module.exports = mongoose.model("Document", documentSchema);