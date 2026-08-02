const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const bookController = require('../controller/book');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'cover' ? 'covers' : 'ebooks';
    cb(null, path.join(__dirname, '../uploads', folder));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 688c12345abcd67890ef1234
 *         title:
 *           type: string
 *           example: Atomic Habits
 *         author:
 *           type: string
 *           example: James Clear
 *         description:
 *           type: string
 *           example: A practical guide to building good habits.
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Self Help
 *             - Productivity
 *         isFree:
 *           type: boolean
 *           example: true
 *         fileUrl:
 *           type: string
 *           example: /uploads/ebooks/book.pdf
 *         coverImageUrl:
 *           type: string
 *           example: /uploads/covers/cover.jpg
 *         uploadedBy:
 *           type: string
 *           example: 688c12345abcd67890ef1234
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by title, author or description
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: free
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Books retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', bookController.getBooks);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get a single book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book retrieved successfully
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
router.get('/:id', bookController.getBook);

/**
 * @swagger
 * /books/{id}/read:
 *   get:
 *     summary: Read a free book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book file returned
 *       403:
 *         description: Book is not free
 *       404:
 *         description: Book not found
 */
router.get('/:id/read', bookController.readBook);

/**
 * @swagger
 * /books/{id}/download:
 *   get:
 *     summary: Download a free book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Download started
 *       403:
 *         description: Book is not free
 *       404:
 *         description: Book not found
 */
router.get('/:id/download', bookController.downloadBook);

/**
 * @swagger
 * /books/{id}/favorite:
 *   post:
 *     summary: Add or remove a book from favorites
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favorites updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Book not found
 */
router.post('/:id/favorite', authenticate, bookController.favoriteBook);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a new book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               description:
 *                 type: string
 *               categories:
 *                 type: string
 *                 example: Fiction,Romance
 *               isFree:
 *                 type: boolean
 *               file:
 *                 type: string
 *                 format: binary
 *               cover:
 *                 type: string
 *                 format: binary
 *               fileUrl:
 *                 type: string
 *                 description: Optional external URL instead of uploading a file
 *               coverImageUrl:
 *                 type: string
 *                 description: Optional external cover image URL
 *     responses:
 *       201:
 *         description: Book created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  bookController.createBook
);

/**
 * @swagger
 * /books/{id}:
 *   patch:
 *     summary: Update a book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               description:
 *                 type: string
 *               categories:
 *                 type: string
 *               isFree:
 *                 type: boolean
 *               file:
 *                 type: string
 *                 format: binary
 *               cover:
 *                 type: string
 *                 format: binary
 *               fileUrl:
 *                 type: string
 *               coverImageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Book not found
 */
router.patch(
  '/:id',
  authenticate,
  authorizeAdmin,
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  bookController.updateBook
);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Book not found
 */
router.delete('/:id', authenticate, authorizeAdmin, bookController.deleteBook);

module.exports = router;