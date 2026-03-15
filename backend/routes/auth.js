const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const { photoUpload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Register - with photo upload
router.post('/register', photoUpload.single('photo'), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Profile photo is required for identity verification' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Remove uploaded file
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      photo: `/uploads/photos/${req.file.filename}`,
      role: 'candidate'
    });
    
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to AI Interview System.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        phone: user.phone
      }
    });
  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch(e) {}
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photo: user.photo,
        phone: user.phone,
        skills: user.skills
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -faceDescriptor');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create admin (one-time setup)
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;
    if (adminSecret !== 'ADMIN_SECRET_2024') {
      return res.status(403).json({ success: false, message: 'Invalid admin secret' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email exists' });
    
    const admin = await User.create({ name, email, password, role: 'admin', photo: null });
    const token = generateToken(admin._id);
    res.json({ success: true, message: 'Admin created', token, user: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// One-time admin setup route
router.post('/setup-admin', async (req, res) => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const existing = await User.findOne({ email: 'admin@company.com' });
    if (existing) return res.json({ message: 'Admin already exists!' });
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'HR Admin', email: 'admin@company.com', password: hash, role: 'admin' });
    res.json({ message: 'Admin created successfully!' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
