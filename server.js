const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
const ebookDir = path.join(uploadsDir, 'ebooks');
const coverDir = path.join(uploadsDir, 'covers');
fs.mkdirSync(ebookDir, { recursive: true });
fs.mkdirSync(coverDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);

// Swagger config
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BookStore API',
      version: '1.0.0',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://myapp.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const openapiSpecification = swaggerJsdoc(options);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

app.get('/', (req, res) => {
  res.json({ message: 'BookStore API is running' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
});
