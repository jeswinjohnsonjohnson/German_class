const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected for seeding"))
  .catch(err => console.error(err));

const users = [
  {
    username: "jeswinjohnson54",
    email: "jeswinjohnson54@gmail.com",
    password: "jes123",
    level: "A1"
  },
  {
    username: "student1",
    email: "student1@gmail.com",
    password: "pass123",
    level: "A2"
  },
  {
    username: "student2",
    email: "student2@gmail.com",
    password: "pass123",
    level: "B1"
  }
];

const seedUsers = async () => {
  try {

    await User.deleteMany(); // optional (clears old users)

    await User.insertMany(users);

    console.log("Users seeded successfully");

    process.exit();

  } catch (error) {

    console.error("Seeding error:", error);
    process.exit(1);

  }
};

seedUsers();