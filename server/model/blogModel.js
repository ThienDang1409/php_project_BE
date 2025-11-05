// models/News.js
const mongoose = require('mongoose');

// Định nghĩa Schema (cấu trúc dữ liệu)
const BlogSchema = new mongoose.Schema({
  // Mongoose tự động tạo _id, nên không cần định nghĩa 'id'
  
  date: {
    type: String, // Lưu trữ ngày tháng dưới dạng chuỗi (String)
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true, // Loại bỏ khoảng trắng ở đầu/cuối
  },
  excerpt: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: '/default-image.jpg', // Có thể đặt giá trị mặc định
  },
  category: {
    type: String,
    required: true,
    enum: ['Events', 'Products', 'General'], // Giới hạn các giá trị có thể
  },
  // Bạn có thể thêm timestamp để theo dõi thời gian tạo/cập nhật
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

BlogSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

BlogSchema.set('toJSON', {
    virtuals: true,
});

// Tạo Model từ Schema
const Blog = mongoose.model('Blog', BlogSchema);

module.exports = Blog;
module.BlogSchema = BlogSchema;