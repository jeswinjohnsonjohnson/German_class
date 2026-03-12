const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const formData = require("form-data");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);
const User = require("./models/User");
const Booking = require("./models/Booking");

require("dotenv").config();
//
const app = express();

app.use(cors());
app.use(express.json());

//
// ======================================================
// CREATE UPLOAD FOLDER (IMPORTANT FOR RAILWAY)
// ======================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// ======================================================
// SERVE STATIC FILES
// ======================================================

app.use("/uploads", express.static(uploadDir));


// ======================================================
// MONGODB
// ======================================================

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.error(err));


// ======================================================
// MAILGUN
// ======================================================



// ======================================================
// FILE UPLOAD
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    cb(null, true); // allow all file types
  }
});


// ======================================================
// USERS
// ======================================================

// LOGIN

app.post("/users/login", async (req,res)=>{

try{

const {email,password} = req.body;

// convert email to lowercase
const emailLower = email.toLowerCase().trim();

const user = await User.findOne({ email: emailLower });

if(!user || user.password !== password){
return res.status(400).json({message:"Invalid login"});
}

res.json({
id:user._id,
username:user.username,
email:user.email,
level:user.level
});

}catch(err){

console.error(err);
res.status(500).json({message:"Login error"});

}

});


// GET USERS

app.get("/users", async (req,res)=>{

try{

const users = await User.find();
res.json(users);

}catch(err){

console.error(err);
res.status(500).json({message:"Error fetching users"});

}

});


// CREATE USER

app.post("/users", async (req,res)=>{

try{

const {username,email,password,level} = req.body;

const user = new User({
username,
email: email.toLowerCase().trim(),
password,
level,
documents:[]
});

await user.save();

res.status(201).json(user);

}catch(err){

console.error(err);
res.status(500).json({message:"Error creating user"});

}

});


// UPDATE USER

app.put("/users/:id", async (req,res)=>{

try{

const {username,email,password,level} = req.body;

const updated = await User.findByIdAndUpdate(

req.params.id,
{
username,
email: email.toLowerCase().trim(),
password,
level
},
{new:true}

);

res.json(updated);

}catch(err){

console.error(err);
res.status(500).json({message:"Error updating user"});

}

});


// DELETE USER

app.delete("/users/:id", async (req,res)=>{

try{

await User.findByIdAndDelete(req.params.id);

res.json({message:"User deleted"});

}catch(err){

console.error(err);
res.status(500).json({message:"Error deleting user"});

}

});


// ======================================================
// UPLOAD DOCUMENT TO USER
// ======================================================

app.post("/users/upload-doc", upload.single("file"), async (req,res)=>{

try{

const {userId} = req.body;

if(!req.file){
return res.status(400).json({message:"No file uploaded"});
}

const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

const user = await User.findById(userId);

if(!user){
return res.status(404).json({message:"User not found"});
}

user.documents.push({
name:req.file.originalname,
fileUrl
});

await user.save();

res.json({message:"Document uploaded",user});

}catch(err){

console.error(err);
res.status(500).json({message:"Upload failed"});

}

});


// DELETE DOCUMENT

app.delete("/users/:userId/documents/:docId", async (req, res) => {

  try {

    const { userId, docId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const doc = user.documents.id(docId);

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // delete file from disk
    const filePath = path.join(uploadDir, path.basename(doc.fileUrl));

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    doc.deleteOne();

    await user.save();

    res.json({ message: "Document deleted" });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Error deleting document" });

  }

});


// ======================================================
// BOOKINGS
// ======================================================

app.get("/bookings", async (req,res)=>{

try{

// get today's date
const today = new Date().toISOString().split("T")[0];

// only future bookings
const bookings = await Booking.find({
  date: { $gte: today }
}).sort({ date: 1, time: 1 });

res.json(bookings);

}catch(err){

console.error(err);
res.status(500).json({message:"Error fetching bookings"});

}

});

app.post("/bookings", async (req,res)=>{

try{

const {email,level,date,time} = req.body;

// 🔒 Prevent duplicate booking
const existingBooking = await Booking.findOne({ date, time, level });

if(existingBooking){
return res.status(400).json({ message: "This slot is already booked" });
}

const user = await User.findOne({
email: email.toLowerCase().trim()
});

const booking = new Booking({
  username: user ? user.username : email.split("@")[0],
  email,
  level,
  date,
  time,
  createdAt: dayjs().utc().toDate()
});

await booking.save();

res.status(201).json(booking);

}catch(err){

console.error(err);
res.status(500).json({message:"Booking error"});

}

});


app.delete("/bookings/:id", async (req,res)=>{

try{

await Booking.findByIdAndDelete(req.params.id);

res.json({message:"Booking deleted"});

}catch(err){

console.error(err);
res.status(500).json({message:"Error deleting booking"});

}

});


// ======================================================
// GET ALL DOCUMENTS
// ======================================================

app.get("/documents", async (req, res) => {

  try {

    const users = await User.find();

    const documents = [];

    users.forEach(user => {

      if (user.documents && user.documents.length > 0) {

        user.documents.forEach(doc => {

          documents.push({
            _id: doc._id,
            userId: user._id,
            username: user.username,
            name: doc.name,
            fileUrl: doc.fileUrl
          });

        });

      }

    });

    res.json(documents);

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Error fetching documents" });

  }

});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
console.log(`Server running on port ${PORT}`);
});