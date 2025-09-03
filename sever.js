require('dotenv').config();
// console.log('CI ENV: MONGO_URI is', process.env.MONGODB_URL); 
require('./config/database');
const express = require('express');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT;
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const userRouter = require('./routes/user');
const exchangerRouter = require('./routes/exchanger');
const referralRoutes = require('./routes/referral');
const taskRoutes = require('./routes/task');
const companyWalletRouter = require('./routes/companyWallet');
const adminRouter = require('./routes/admin');
const cron = require('node-cron');
const { splittingRevenue } = require('./utils/companyWallet');
const userTaskProgressRoute = require('./routes/user.taskProgress')
const incubatorRoutes = require('./routes/incubator');
const { deactivateActivation, completeCountdown } = require('./controllers/incubator');


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
app.use(cors());
app.use(morgan('combined'));
const baseUrl = '/api/v1';

app.use(baseUrl, userRouter);
app.use(baseUrl, exchangerRouter);
app.use(`${baseUrl}/referrals`, referralRoutes);
app.use(`${baseUrl}/tasks`, taskRoutes);
app.use(baseUrl, companyWalletRouter);
app.use(baseUrl, adminRouter);
app.use(`${baseUrl}/taskprogresses`, userTaskProgressRoute)
app.use(`${baseUrl}/incubator`, incubatorRoutes)


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('⏰ Splitting revenue balance...');
    await splittingRevenue();
    console.log('Done splitting revenue balance...');
    console.log('Next splitting in 6 hours...');
  } catch (error) {
    console.error('Error splitting revenue balance:', error.message);
  }
});

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log('⏰ Running scheduled deactivation tasks...');
  await deactivateActivation();
  await completeCountdown();
  // console.log('⏰ Running scheduled autocoplettask tasks...');
});

app.listen(PORT, () => {
  console.log(`Server is listening to Port: ${PORT}`);
});
