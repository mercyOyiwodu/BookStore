const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
  ],
  isVerified: {
    type: Boolean,
    default: true,
  },
  isLoggedIn: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true })

const userModel = mongoose.model('User', UserSchema)

module.exports = userModel