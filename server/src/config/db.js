const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy server/.env.example to server/.env and add your Atlas URI.');
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = { connectDB };
