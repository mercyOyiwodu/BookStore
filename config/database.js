const mongoose = require('mongoose')
require('dotenv').config()
const db = process.env.MONGO_DB

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    console.log('Connection to Database Has Been Established Successfully')
  } catch (err) {
    console.error('Error Connecting To Database:', err.message)
    process.exit(1)
  }
}
console.log(process.env.MONGO_DB);
module.exports = connectDB