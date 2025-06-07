require('dotenv').config();
require('./config/database');
const express = require('express');
const PORT = process.env.PORT || 8080;
const app = express();
const userRouter = require('./routes/user');
const referralRoutes = require('./routes/referral')

app.use(express.json());
app.use('api/v1',userRouter)
app.use('/referral',referralRoutes );

app.listen(PORT, () => {
  console.log(`Server is listening to Port: ${PORT}`)
});