const mongoose = require('mongoose');
require('dotenv').config()
const url = process.env.MONGODB_URL || "mongodb+srv://uootes:6eA4ojHea5IFksQT@cluster0.65wppn2.mongodb.net/Uootes"

mongoose.connect(url)
.then(() =>
console.log('Connected to MongoDB'))
.catch((err) =>
console.log('Could not connect to MongoDB', err));        