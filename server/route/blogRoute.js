const express = require('express');
const router = express.Router();
const Blog = require('../model/blogModel');
const Information = require('../model/informationModel');

// =============================
// 🔹 1. Lấy danh sách Blog (tất cả hoặc lọc theo category / tìm kiếm)
// =============================
router.get('/', async (req, res) => {
  try {
    const { informationId, search, status } = req.query;
    const filter = {};

    if (informationId) filter.informationId = informationId;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { sections: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    const blogs = await Blog.find(filter)
      .populate('informationId', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách blog.' });
  }
});

// =============================
// 🔹 2. Lấy chi tiết 1 Blog theo ID
// =============================
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('informationId', 'name slug');
    if (!blog) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error('Error fetching blog by ID:', error);
    res.status(500).json({ message: 'Lỗi khi lấy bài viết.' });
  }
});

// =============================
// 🔹 3. Lấy blog theo slug (SEO-friendly)
// =============================
router.get('/slug/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate('informationId', 'name slug');
    if (!blog) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết theo slug.' });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    res.status(500).json({ message: 'Lỗi khi lấy bài viết theo slug.' });
  }
});

// =============================
// 🔹 4. Thêm mới Blog
// =============================
router.post('/', async (req, res) => {
  try {
    const { title, slug, sections, author, informationId, image, tags, status } = req.body;

    const existing = await Blog.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Slug đã tồn tại.' });
    }

    // Kiểm tra category hợp lệ (nếu có)
    if (informationId) {
      const category = await Information.findById(informationId);
      if (!category) {
        return res.status(400).json({ message: 'Category không hợp lệ.' });
      }
    }

    const newBlog = new Blog({
      title,
      slug,
      sections,
      author,
      informationId,
      image,
      tags,
      status: status || 'draft'
    });

    const savedBlog = await newBlog.save();
    res.status(201).json(savedBlog);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: 'Lỗi khi tạo bài viết.' });
  }
});

// =============================
// 🔹 5. Cập nhật Blog
// =============================
router.put('/:id', async (req, res) => {
  try {
    const { title, slug, sections, author, informationId, image, tags, status } = req.body;

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, slug, sections, author, informationId, image, tags, status },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết để cập nhật.' });
    }

    res.status(200).json(updatedBlog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật bài viết.' });
  }
});

// =============================
// 🔹 6. Xóa Blog
// =============================
router.delete('/:id', async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).json({ message: 'Không tìm thấy bài viết để xóa.' });
    }
    res.status(200).json({ message: 'Đã xóa bài viết thành công.' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Lỗi khi xóa bài viết.' });
  }
});

// =============================
// 🔹 7. Lấy blog theo danh mục (category slug)
// =============================
router.get('/category/:slug', async (req, res) => {
  try {
    const category = await Information.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy category.' });
    }

    const blogs = await Blog.find({ informationId: category._id })
      .populate('informationId', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching blogs by category:', error);
    res.status(500).json({ message: 'Lỗi khi lấy bài viết theo danh mục.' });
  }
});

// =============================
// 🔹 8. Đếm số lượng bài viết theo category
// =============================
router.get('/stats/count-by-category', async (req, res) => {
  try {
    const stats = await Blog.aggregate([
      { $group: { _id: '$informationId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'informations',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          category: { $arrayElemAt: ['$category.name', 0] }
        }
      }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error counting blogs by category:', error);
    res.status(500).json({ message: 'Lỗi khi thống kê số lượng bài viết.' });
  }
});

module.exports = router;
