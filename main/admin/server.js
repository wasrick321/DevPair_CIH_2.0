const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, 'main', 'user_site')));
app.use(express.static(path.join(__dirname, 'main', 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/hospitalDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB error:'));
db.once('open', () => console.log('✅ MongoDB connected'));

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

// Start Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'main', 'user_site', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
