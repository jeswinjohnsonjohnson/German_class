const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Mailgun = require("mailgun.js");
const formData = require("form-data");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("./models/User");
const Booking = require("./models/Booking");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


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

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY
});


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

const upload = multer({ storage });


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

app.delete("/users/:userId/documents/:docId", async (req,res)=>{

try{

const {userId,docId} = req.params;

const user = await User.findById(userId);

user.documents = user.documents.filter(d=>d._id.toString() !== docId);

await user.save();

res.json({message:"Document deleted"});

}catch(err){

console.error(err);
res.status(500).json({message:"Error deleting document"});

}

});


// ======================================================
// BOOKINGS
// ======================================================

app.get("/bookings", async (req,res)=>{

try{

const bookings = await Booking.find();
res.json(bookings);

}catch(err){

console.error(err);
res.status(500).json({message:"Error fetching bookings"});

}

});


app.post("/bookings", async (req,res)=>{

try{

const {email,level,date,time} = req.body;

const user = await User.findOne({
email: email.toLowerCase().trim()
});

const booking = new Booking({

username:user ? user.username : email.split("@")[0],
email,
level,
date,
time

});

await booking.save();

await mg.messages.create(process.env.MAILGUN_DOMAIN,{

from:`Flock International <${process.env.EMAIL_FROM}>`,
to:[email],
subject:"Booking Confirmation",
text:`Booking confirmed on ${date} at ${time}`

});

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