const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  }
});

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true 
  },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  password: { 
    type: String, 
    required: true 
  },

  level: { 
    type: String 
  },

  documents: [documentSchema]   // ← documents stored per user
});

module.exports = mongoose.model("User", userSchema);