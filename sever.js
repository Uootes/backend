require('dotenv').config();
require('./config/database');
const express = require('express');
const PORT = process.env.PORT;
const app = express();
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const   userRouter = require('./routes/user');
const exchangerRouter = require('./routes/exchanger');
const referralRoutes = require('./routes/referral');

// ======== Swagger Configuration ========
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Documentation',
      version: '1.0.0',
      description: 'API for user, exchanger, and referral services',
    },
    servers: [
      { 
        url: `http://localhost:2030`, 
        description: 'Local server' 
      },
      {
        url: 'https://uootes.onrender.com', 
        description: 'Production server'
      }
    ],
  },
  apis: ['./routes/*.js'], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(express.json());
app.use(morgan('combined'));

app.use('/api/v1', userRouter);
app.use('/api/v1', exchangerRouter);
app.use('/referral', referralRoutes);

// ======== Swagger UI ========
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ======== Start Server ========
app.listen(PORT, () => {
  console.log(`Server is listening to Port: ${PORT}`);
});