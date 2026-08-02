const path = require('path');
const fs = require('fs');
const Book = require('../models/book');
const User = require('../models/user');

function buildBookFromRequest(req) {
  const { title, author, description, categories = '', isFree = 'true', fileUrl, coverImageUrl } = req.body;
  const categoryList = (categories || '')
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  let resolvedFileUrl = fileUrl;
  let resolvedCoverUrl = coverImageUrl;

  if (req.files) {
    const uploadedFile = req.files.file?.[0] || req.files.ebook?.[0];
    const uploadedCover = req.files.cover?.[0];

    if (uploadedFile) {
      resolvedFileUrl = `/${path.join('uploads', 'ebooks', uploadedFile.filename).replace(/\\/g, '/')}`;
    }

    if (uploadedCover) {
      resolvedCoverUrl = `/${path.join('uploads', 'covers', uploadedCover.filename).replace(/\\/g, '/')}`;
    }
  }

  return {
    title,
    author,
    description,
    categories: categoryList,
    isFree: isFree === 'false' ? false : true,
    fileUrl: resolvedFileUrl,
    coverImageUrl: resolvedCoverUrl,
  };
}

exports.createBook = async (req, res) => {
  try {
    const bookData = buildBookFromRequest(req);
    if (!bookData.title || !bookData.author || !bookData.fileUrl) {
      return res.status(400).json({ message: 'title, author, and fileUrl or uploaded file are required' });
    }

    const book = new Book({
      ...bookData,
      uploadedBy: req.user._id,
    });

    await book.save();
    res.status(201).json({ message: 'Book created successfully', data: book });
  } catch (error) {
    res.status(500).json({ message: 'Error creating book', error: error.message });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const { q, author, category, free } = req.query;
    const filter = {};

    if (q) {
      const searchRegex = new RegExp(q, 'i');
      filter.$or = [{ title: searchRegex }, { author: searchRegex }, { description: searchRegex }];
    }
    if (author) {
      filter.author = new RegExp(author, 'i');
    }
    if (category) {
      filter.categories = new RegExp(category, 'i');
    }
    if (free === 'true' || free === 'false') {
      filter.isFree = free === 'true';
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ message: 'Books retrieved', count: books.length, data: books });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving books', error: error.message });
  }
};

exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('uploadedBy', 'fullName email');
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json({ data: book });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving book', error: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const existingBook = await Book.findById(req.params.id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const updateData = buildBookFromRequest(req);
    const allowedUpdates = ['title', 'author', 'description', 'categories', 'isFree', 'fileUrl', 'coverImageUrl'];
    allowedUpdates.forEach((key) => {
      if (updateData[key] !== undefined) {
        existingBook[key] = updateData[key];
      }
    });

    await existingBook.save();
    res.status(200).json({ message: 'Book updated', data: existingBook });
  } catch (error) {
    res.status(500).json({ message: 'Error updating book', error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (deleted.fileUrl && deleted.fileUrl.startsWith('/uploads/ebooks/')) {
      const filePath = path.resolve(__dirname, '..', deleted.fileUrl.slice(1));
      fs.unlink(filePath, () => {});
    }
    if (deleted.coverImageUrl && deleted.coverImageUrl.startsWith('/uploads/covers/')) {
      const coverPath = path.resolve(__dirname, '..', deleted.coverImageUrl.slice(1));
      fs.unlink(coverPath, () => {});
    }

    res.status(200).json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting book', error: error.message });
  }
};

exports.favoriteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const user = await User.findById(req.user._id);
    const bookIdString = book._id.toString();
    const existingIndex = user.favorites.findIndex((favoriteId) => favoriteId.toString() === bookIdString);

    if (existingIndex >= 0) {
      user.favorites.splice(existingIndex, 1);
      await user.save();
      return res.status(200).json({ message: 'Book removed from favorites', favorites: user.favorites });
    }

    user.favorites.push(book._id);
    await user.save();
    res.status(200).json({ message: 'Book added to favorites', favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: 'Error updating favorites', error: error.message });
  }
};

exports.downloadBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (!book.isFree) {
      return res.status(403).json({ message: 'This book is not available for free download' });
    }

    if (!book.fileUrl) {
      return res.status(404).json({ message: 'Book file is missing' });
    }

    if (book.fileUrl.startsWith('http')) {
      return res.redirect(book.fileUrl);
    }

    const filePath = path.resolve(__dirname, '..', book.fileUrl.slice(1));
    res.download(filePath, (err) => {
      if (err) {
        res.status(500).json({ message: 'Error downloading file', error: err.message });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error downloading book', error: error.message });
  }
};

exports.readBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (!book.isFree) {
      return res.status(403).json({ message: 'This book is not available for free reading' });
    }

    if (!book.fileUrl) {
      return res.status(404).json({ message: 'Book file is missing' });
    }

    if (book.fileUrl.startsWith('http')) {
      return res.redirect(book.fileUrl);
    }

    const filePath = path.resolve(__dirname, '..', book.fileUrl.slice(1));
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(500).json({ message: 'Error reading file', error: err.message });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error reading book', error: error.message });
  }
};
