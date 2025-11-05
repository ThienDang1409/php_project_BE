const express = require('express');
const router = express.Router();
// Import model - phù hợp với file hiện tại: server/model/blogModel.js
const Blog = require('../model/blogModel'); // Nhớ đổi nếu bạn đổi tên file/model

// --- 1. GET ALL Blog Posts (Lấy tất cả bài viết) ---
// GET /api/blog
router.get('/', async (req, res) => {
  try {
    // Lấy tất cả bài viết và sắp xếp theo ngày tạo mới nhất
    const posts = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách bài viết.' });
  }
});

// --- 2. GET SINGLE Blog Post (Lấy một bài viết theo ID) ---
// GET /api/blog/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    }
    
    res.status(200).json(post);
  } catch (err) {
    // Xử lý nếu ID không hợp lệ (ví dụ: ObjectId sai định dạng)
    res.status(400).json({ message: 'ID bài viết không hợp lệ.' });
  }
});

// --- 3. CREATE New Blog Post (Tạo bài viết mới) ---
// POST /api/blog
router.post('/', async (req, res) => {
  // Giả định dữ liệu được gửi trong body (req.body)
  console.log('Received POST data:', req);
  console.log('Received POST data1:', req.body);

  const newPost = new Blog({
    date: req.body.date,
    title: req.body.title,
    excerpt: req.body.excerpt,
    image: req.body.image,
    category: req.body.category,
  });

  try {
    const savedPost = await newPost.save();
    // Trả về bài viết vừa tạo với mã trạng thái 201 (Created)
    res.status(201).json(savedPost);
  } catch (err) {
    // Xử lý lỗi validation hoặc lỗi database
    res.status(400).json({ message: err.message });
  }
});

// --- 4. UPDATE Blog Post (Cập nhật bài viết) ---
// PUT /api/blog/:id
router.put('/:id', async (req, res) => {
  try {
    const updatedPost = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // $set chỉ cập nhật các trường được gửi trong body
      { new: true, runValidators: true } // 'new: true' trả về tài liệu đã cập nhật
    );

    if (!updatedPost) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết để cập nhật.' });
    }

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- 5. DELETE Blog Post (Xóa bài viết) ---
// DELETE /api/blog/:id
router.delete('/:id', async (req, res) => {
  try {
    const deletedPost = await Blog.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết để xóa.' });
    }

    res.status(200).json({ message: 'Bài viết đã được xóa thành công.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa bài viết.' });
  }
});

module.exports = router;