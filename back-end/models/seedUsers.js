const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

// User model
const User = require("./User"); // adjust path if needed

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch(err => console.error("Connection error:", err));

// Seed function
async function seedUsers() {
  const users = [
    { email: "alice@test.com", password: "alice123" },
    { email: "bob@test.com", password: "bob123" },
    { email: "charlie@test.com", password: "charlie123" },
    { email: "david@test.com", password: "david123" },
    { email: "eve@test.com", password: "eve123" },
  ];

  try {
    for (let u of users) {
      await User.create(u);
      console.log(`Added: ${u.email}`);
    }
    console.log("All users added successfully!");
  } catch (err) {
    console.error("Error adding users:", err);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seed
seedUsers();