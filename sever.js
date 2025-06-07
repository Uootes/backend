require('dotenv').config();
require('./config/database');
const express = require('express');
const PORT = process.env.PORT || 8080;
const app = express();
const userRouter = require('./routes/user');
const exchangerRouter = require('./routes/exchanger');

app.use(express.json());
app.use('api/v1',userRouter);
app.use('api/v1', exchangerRouter);

app.listen(PORT, () => {
  console.log(`Server is listening to Port: ${PORT}`)
});