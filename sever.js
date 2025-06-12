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

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation For Uootes',
      version: '1.0.0',
      description: 'Uootes is solving is that earning money is challenging and difficult due to the advancement of technology and job scarcity. Uootes aims to make earning easy and accessible.',
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
  apis: ['./routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(express.json());
app.use(morgan('combined'));

app.use('/api/v1', userRouter);
app.use('/api/v1', exchangerRouter);
app.use('/referral', referralRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server is listening to Port: ${PORT}`);
});