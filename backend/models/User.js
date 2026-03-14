const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['candidate', 'admin'], default: 'candidate' },
  photo: { type: String, default: null }, // Photo path for face verification
  phone: { type: String, default: '' },
  
  // Candidate specific
  resumePath: { type: String, default: null },
  resumeText: { type: String, default: '' },
  skills: [{ type: String }],
  experience: { type: Number, default: 0 },
  
  // Face verification
  faceDescriptor: { type: [Number], default: [] }, // facial landmark data
  isVerified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
