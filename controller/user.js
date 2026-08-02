const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const { sendMail } = require('../utils/resend')
const { signUpTemplate } = require('../utils/mailTemplates')

function createToken(user) {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

function safeUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    favorites: user.favorites,
    isVerified: user.isVerified,
    isLoggedIn: user.isLoggedIn,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, adminCode } = req.body
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email, and password are required' })
    }

    const normalizedEmail = email.toLowerCase()
    const emailExists = await User.findOne({ email: normalizedEmail })
    if (emailExists) {
      return res.status(409).json({ message: 'Email has already been taken' })
    }

    const role = adminCode && adminCode === process.env.ADMIN_CODE ? 'admin' : 'user'
    if (adminCode && role !== 'admin') {
      return res.status(403).json({ message: 'Invalid admin code' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new User({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    })

    const token = createToken(user)
    const firstName = fullName.split(' ')[0] || fullName
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const html = signUpTemplate(otp, firstName)
    await sendMail({ subject: 'Welcome Email', email: user.email, html })

    await user.save()
    res.status(201).json({ message: 'User created successfully', data: safeUser(user), token })
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(404).json({ message: `User with email ${email} does not exist` })
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password)
    if (!isCorrectPassword) {
      return res.status(400).json({ message: 'Incorrect password' })
    }

    if (user.isVerified === false) {
      return res.status(400).json({ message: 'User not verified. Please check your email to verify.' })
    }

    if (user.isLoggedIn === true) {
      return res.status(400).json({ message: 'User already logged in' })
    }

    user.isLoggedIn = true
    await user.save()

    const token = createToken(user)
    res.status(200).json({ message: 'Login successful', data: safeUser(user), token })
  } catch (error) {
    res.status(500).json({ message: 'Error logging in user', error: error.message })
  }
}

exports.getProfile = async (req, res) => {
  try {
    res.status(200).json({ data: safeUser(req.user) })
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving profile', error: error.message })
  }
}


