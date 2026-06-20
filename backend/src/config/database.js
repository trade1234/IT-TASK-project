const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host} - database.js:6`);
    return conn;
  } catch (error) {
    console.error('Database connection error: - database.js:9', error);
    process.exit(1);
  }
};

module.exports = connectDB;