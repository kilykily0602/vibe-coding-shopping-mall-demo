const mongoose = require('mongoose');

const CATEGORIES = ['상의', '하의', '악세사리'];

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    // 상세 갤러리(같은 상품의 다른 각도/장면). 없으면 image 기준으로 생성
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
module.exports.CATEGORIES = CATEGORIES;
