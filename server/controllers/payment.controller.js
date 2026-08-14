const Order = require('../models/order');
const Cart = require('../models/cart');
const User = require('../models/user');
const { verifyPaidPayment } = require('../utils/portonePayment');

function getUserId(req) {
  return req.user?.id;
}

function buildOrderNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ORD-${y}${m}${d}-${rand}`;
}

async function getPopulatedOrder(orderId, userId) {
  const filter = { _id: orderId };
  if (userId) filter.user = userId;

  return Order.findOne(filter)
    .populate('items.product', 'sku name price category image description')
    .populate('user', 'name email phone address');
}

async function buildOrderFromCart(userId, shipping, paymentMethod, paymentId) {
  const cart = await Cart.findOne({ user: userId }).populate(
    'items.product',
    'sku name price category image'
  );

  if (!cart || cart.items.length === 0) {
    const error = new Error('장바구니가 비어 있습니다.');
    error.status = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('유저를 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }

  const shippingInfo = {
    name: shipping?.name || user.name,
    phone: shipping?.phone || user.phone || '',
    address: shipping?.address || user.address || '',
  };

  if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
    const error = new Error('배송 정보(name, phone, address)가 필요합니다.');
    error.status = 400;
    throw error;
  }

  const orderItems = [];
  let itemCount = 0;
  let totalAmount = 0;

  for (const item of cart.items) {
    if (!item.product) {
      const error = new Error('장바구니에 존재하지 않는 상품이 있습니다.');
      error.status = 400;
      throw error;
    }

    const quantity = Number(item.quantity) || 0;
    const price = Number(item.product.price) || 0;

    orderItems.push({
      product: item.product._id,
      quantity,
    });

    itemCount += quantity;
    totalAmount += price * quantity;
  }

  return {
    cart,
    orderPayload: {
      orderNo: buildOrderNo(),
      user: userId,
      items: orderItems,
      itemCount,
      totalAmount,
      shipping: shippingInfo,
      orderStatus: '주문확인',
      paymentMethod: paymentMethod || 'none',
      paymentId: paymentId || '',
    },
  };
}

// POST /api/payments/confirm
// body: { paymentId, shipping, paymentMethod, clientSaidFailed? }
async function confirmPayment(req, res, next) {
  try {
    const userId = getUserId(req);
    const {
      paymentId,
      shipping,
      paymentMethod = 'card',
      clientSaidFailed = false,
    } = req.body;

    const normalizedPaymentId = String(paymentId || '').trim();
    if (!normalizedPaymentId) {
      return res.status(400).json({ message: 'paymentId가 필요합니다.' });
    }

    // 중복 주문 체크
    const existing = await Order.findOne({
      paymentId: normalizedPaymentId,
      user: userId,
    });
    if (existing) {
      const populated = await getPopulatedOrder(existing._id, userId);
      return res.json({
        message: '이미 처리된 결제입니다.',
        order: populated,
        paymentStatus: 'PAID',
        recovered: true,
        duplicated: true,
      });
    }

    const { cart, orderPayload } = await buildOrderFromCart(
      userId,
      shipping,
      paymentMethod,
      normalizedPaymentId
    );

    // 포트원 결제 검증 (PAID + 금액 일치)
    try {
      await verifyPaidPayment(normalizedPaymentId, orderPayload.totalAmount);
    } catch (verifyErr) {
      return res.status(verifyErr.status || 400).json({
        message: verifyErr.message || '결제 검증에 실패했습니다.',
        paymentStatus: verifyErr.paymentStatus || 'UNKNOWN',
        detail: verifyErr.payload,
      });
    }

    const order = await Order.create(orderPayload);
    cart.items = [];
    await cart.save();

    const populated = await getPopulatedOrder(order._id, userId);
    return res.status(201).json({
      message: clientSaidFailed
        ? '결제는 승인되어 주문을 복구했습니다.'
        : '결제가 확인되어 주문이 완료되었습니다.',
      order: populated,
      paymentStatus: 'PAID',
      recovered: Boolean(clientSaidFailed),
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        message: error.message,
        detail: error.payload,
      });
    }
    next(error);
  }
}

module.exports = {
  confirmPayment,
};
