// db.js
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB:', process.env.MONGODB_URI); // Log URI for verification
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process if the connection fails
  }
};

// Define the Deposit schema
const depositSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  amount: { type: Number, required: true },
  publicKey: { type: String, required: false },
  privateKey: { type: String, required: false },
  depositedAt: { type: Date, default: Date.now },
});

const Deposit = mongoose.model('bot_deposit', depositSchema);

module.exports = { connectDB, Deposit };
