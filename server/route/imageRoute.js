const express = require('express');
const router = express.Router();
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

// Model
const { ImageUpload } = require('../model/imageUpload');

// Configure Cloudinary from environment
cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// helper to upload buffer to Cloudinary
function uploadBufferToCloud(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// POST /api/image/upload - single file (field: image) or multiple via images[]
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    let images = [];

    if (req.file && req.file.buffer) {
      const uploaded = await uploadBufferToCloud(req.file.buffer, { folder: 'uploads' });
      images.push(uploaded.secure_url || uploaded.url);
    } else if (req.body && req.body.image) {
      // accept image url in body
      images.push(req.body.image);
    }

    // Save to DB
    const doc = new ImageUpload({ images });
    const saved = await doc.save();
    res.status(201).json({ message: 'Uploaded', data: saved });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ message: 'Lỗi upload ảnh', detail: err.message });
  }
});

// POST /api/image/upload-multiple - field: images (multiple)
router.post('/upload-multiple', upload.array('images', 8), async (req, res) => {
  try {
    const files = req.files || [];
    const uploadedUrls = [];

    for (const f of files) {
      const up = await uploadBufferToCloud(f.buffer, { folder: 'uploads' });
      uploadedUrls.push(up.secure_url || up.url);
    }

    const doc = new ImageUpload({ images: uploadedUrls });
    const saved = await doc.save();
    res.status(201).json({ message: 'Uploaded multiple', data: saved });
  } catch (err) {
    console.error('Multi upload error:', err);
    res.status(500).json({ message: 'Lỗi upload nhiều ảnh', detail: err.message });
  }
});

// GET /api/image/:id - get image doc
router.get('/:id', async (req, res) => {
  try {
    const doc = await ImageUpload.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy ảnh.' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: 'ID không hợp lệ.' });
  }
});

// DELETE /api/image/:id?deleteFromCloud=true - delete DB doc; optionally delete files from Cloudinary if possible
router.delete('/:id', async (req, res) => {
  try {
    const doc = await ImageUpload.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' });

    const deleteFromCloud = req.query.deleteFromCloud === 'true';
    const results = { deletedFromDB: false, cloudResults: [] };

    if (deleteFromCloud) {
      for (const url of doc.images) {
        try {
          // Try to extract public_id from URL
          // Cloudinary URL format contains '/upload/' then possible transformations and version, then public id
          const parts = url.split('/upload/');
          if (parts.length > 1) {
            let after = parts[1];
            // remove version like v123456
            after = after.replace(/^v\d+\//, '');
            // remove extension
            const lastDot = after.lastIndexOf('.');
            const publicId = lastDot > 0 ? after.substring(0, lastDot) : after;
            // remove any transformations prefix (contains commas or slashes) - use last slash as folder separator
            // keep everything (folders + publicId)
            const cloudRes = await cloudinary.uploader.destroy(publicId);
            results.cloudResults.push({ url, publicId, cloudRes });
          } else {
            results.cloudResults.push({ url, error: 'Không thể phân tích public_id từ URL' });
          }
        } catch (err) {
          results.cloudResults.push({ url, error: err.message });
        }
      }
    }

    await doc.remove();
    results.deletedFromDB = true;
    res.json({ message: 'Đã xóa', results });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ message: 'Lỗi khi xóa', detail: err.message });
  }
});

module.exports = router;
