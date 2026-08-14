const mongoose = require('mongoose');

const ORDER_STATUS = [
  '주문확인',
  '상품준비중',
  '배송시작',
  '배송중',
  '배송완료',
  '주문취소',
];

const PAYMENT_METHODS = ['card', 'bank', 'kakao', 'naver', 'none'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const shippingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: '주문 상품이 1개 이상 필요합니다.',
      },
    },
    itemCount: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: shippingSchema,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      required: true,
      default: '주문확인',
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'none',
    },
    paymentId: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.statics.findByUserWithDetails = function findByUserWithDetails(
  userId
) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('items.product', 'sku name price category image description')
    .populate('user', 'name email phone address');
};

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUS = ORDER_STATUS;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
