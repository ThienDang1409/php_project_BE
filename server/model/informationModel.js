const mongoose = require('mongoose');

const InformationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // VD: "About", "Products"
  },
  slug: {
    type: String,
    required: true,
    unique: true, // VD: "about", "products"
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Information',
    default: null, // Nếu null → là danh mục cha (top level)
  },
  description: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "/default-image.jpg"
  },
  order: {
    type: Number,
    default: 0, // để sắp xếp thứ tự hiển thị
  }
}, {
  timestamps: true
});

InformationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

InformationSchema.set('toJSON', { virtuals: true });

const Information = mongoose.model('Information', InformationSchema);
module.exports = Information;
