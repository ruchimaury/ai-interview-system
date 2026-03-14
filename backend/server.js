const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  console.error(err.stack);
  process.exit(1);
});

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/jobs', require('./routes/jobs'));
  app.use('/api/candidates', require('./routes/candidates'));
  app.use('/api/tests', require('./routes/tests'));
  app.use('/api/interviews', require('./routes/interviews'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/resume', require('./routes/resume'));
  console.log('✅ All routes loaded');
} catch (e) {
  console.error('❌ Route loading error:', e.message);
  process.exit(1);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Interview System Running', time: new Date() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;