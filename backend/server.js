require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
require('./database');

// Routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const { router: applicationRoutes } = require('./routes/applications');
const testRoutes = require('./routes/tests');
const interviewRoutes = require('./routes/interviews');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Interview System API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║   AI Interview System Backend        ║
║   Running on http://localhost:${PORT}   ║
╚══════════════════════════════════════╝
  `);
});
