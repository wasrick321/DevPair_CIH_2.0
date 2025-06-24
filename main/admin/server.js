require('dotenv').config();
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 7000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, 'main', 'user_site')));
app.use(express.static(path.join(__dirname, 'main', 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection (Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ Connection error:', err));
const db = mongoose.connection;

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// MongoDB Schema
const PatientSchema = new mongoose.Schema({
  name: String,
  patientId: String,
  csvFile: String
});
const Patient = mongoose.model('Patient', PatientSchema);

// API Route
app.post('/api/patient', upload.single('csv'), async (req, res) => {
  const { name, patientId } = req.body;
  const csvFile = req.file ? req.file.path : null;

  if (!name || !patientId || !csvFile) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const newPatient = new Patient({ name, patientId, csvFile });
    await newPatient.save();
    res.status(200).json({ message: 'Patient saved', patient: newPatient });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err });
  }
});

app.get('/', (req, res) => {
  // Serve the correct main user HTML file (change 'html.html' to your actual file if needed)
  res.sendFile(path.join(__dirname, '..', 'user_site', 'html.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// To run your server:

// 1. Make sure you have a .env file in your project root with:
//    MONGO_URI=mongodb+srv://teammate1:admin123@cluster0.euozim4.mongodb.net/hospitalDB

// 2. Install dependencies (run in terminal):
//    npm install express mongoose multer cors dotenv
//    // IMPORTANT: Run this command from the main!\DevPair_CIH_2.0\main\admin folder
//    // This will create node_modules in the correct directory for your server.js

// 3. Start the server (run in terminal):
//    node server.js
//    // (run this command from inside the main!\DevPair_CIH_2.0\main\admin folder)

// The server will run at http://localhost:7000
// Make sure your MongoDB Atlas IP whitelist allows your current IP.

// To install dependencies, open a terminal in this folder:
// d:\del code\html\cih hackathon\main!\DevPair_CIH_2.0\main\admin

// Then run:
//
//    npm install express mongoose multer cors dotenv
//
// This will create a node_modules folder and package-lock.json in the same directory as server.js.
// After installing dependencies, start your server with:
//
//    node server.js
//
// Yes, your server should now work if:
// - You have a .env file with the correct MONGO_URI
// - You installed all dependencies in the admin folder
// - The file html.html exists at: d:\del code\html\cih hackathon\main!\DevPair_CIH_2.0\main\user_site\html.html
// - You run: node server.js from the admin folder

// If all the above are true, visiting http://localhost:7000/ should serve your main user HTML page.
