require('dotenv').config();
// require('./configs/database');

const express = require('express');
const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());


app.listen(PORT, () => {
  console.log(`Server is listening to Port: ${PORT}`)
});