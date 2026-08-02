const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String, default: '' },
  categories: [{ type: String }],
  isFree: { type: Boolean, default: true },
  fileUrl: { type: String, required: true },
  coverImageUrl: { type: String, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Book = mongoose.model('Book', BookSchema);
module.exports = Book;
