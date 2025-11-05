// app.js
// Express server with MongoDB connection and mounted blog routes
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load .env if present
dotenv.config();

const app = express();

// Config / defaults
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://yoyiseo12_db_user:L4oz431LlWnNn4he@cluster0.ybtsayy.mongodb.net/?appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes (user created)
// Route file located at ./route/blogRoute.js
const blogRoute = require('./route/blogRoute');
app.use('/api/blog', blogRoute);

// Image upload route (reusable)
const imageRoute = require('./route/imageRoute');
app.use('/api/image', imageRoute);

// Simple static serving for a possible frontend (optional)
app.use(express.static(path.join(__dirname, '..', '..')));

// Health check / root
app.get('/', (req, res) => {
  res.json({ message: 'Server running', uptime: process.uptime() });
});

// Global 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Không tìm thấy route.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Lỗi máy chủ nội bộ.' });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      // Mongoose 6+ ignores these options but keeping for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB đã kết nối thành công!');
  } catch (err) {
    console.error('❌ Kết nối MongoDB thất bại:', err.message);
  }
};

// Start server after attempting DB connection (server will run even if DB fails)
connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server Express chạy tại http://localhost:${PORT}`);
  });
});

module.exports = app;