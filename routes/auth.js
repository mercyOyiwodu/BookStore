const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controller/user');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User Authentication APIs
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     RegisterUser:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *       properties:
 *         fullName:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Password123
 *         adminCode:
 *           type: string
 *           description: Optional admin code to create an admin account
 *           example: ADMIN123
 *
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: john@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: Password123
 *
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 688c12345abcd67890ef1234
 *         fullName:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         role:
 *           type: string
 *           example: user
 *         favorites:
 *           type: array
 *           items:
 *             type: string
 *         isVerified:
 *           type: boolean
 *           example: true
 *         isLoggedIn:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUser'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: User created successfully
 *               token: jwt_token_here
 *               data:
 *                 _id: 688c12345abcd67890ef1234
 *                 fullName: John Doe
 *                 email: john@example.com
 *                 role: user
 *                 favorites: []
 *                 isVerified: false
 *                 isLoggedIn: false
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Invalid admin code
 *       409:
 *         description: Email has already been taken
 *       500:
 *         description: Internal server error
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUser'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               message: Login successful
 *               token: jwt_token_here
 *               data:
 *                 _id: 688c12345abcd67890ef1234
 *                 fullName: John Doe
 *                 email: john@example.com
 *                 role: user
 *       400:
 *         description: Invalid credentials, user not verified, or already logged in
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get logged in user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 _id: 688c12345abcd67890ef1234
 *                 fullName: John Doe
 *                 email: john@example.com
 *                 role: user
 *                 favorites: []
 *                 isVerified: true
 *                 isLoggedIn: true
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/me', authenticate, getProfile);

module.exports = router;