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

// Create — 장바구니 기준 주문 생성
// POST /api/orders
// body: { shipping?, paymentMethod?, paymentId? }
async function createOrder(req, res, next) {
  try {
    const userId = getUserId(req);
    const { shipping, paymentMethod = 'none', paymentId = '' } = req.body;
    const normalizedPaymentId = String(paymentId || '').trim();

    // 1) 동일 paymentId 주문 중복 체크
    if (normalizedPaymentId) {
      const existing = await Order.findOne({
        paymentId: normalizedPaymentId,
        user: userId,
      });
      if (existing) {
        const populated = await getPopulatedOrder(existing._id, userId);
        return res.status(200).json({
          message: '이미 처리된 결제입니다.',
          order: populated,
          duplicated: true,
        });
      }
    }

    const cart = await Cart.findOne({ user: userId }).populate(
      'items.product',
      'sku name price category image'
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: '장바구니가 비어 있습니다.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    const shippingInfo = {
      name: shipping?.name || user.name,
      phone: shipping?.phone || user.phone || '',
      address: shipping?.address || user.address || '',
    };

    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      return res.status(400).json({
        message: '배송 정보(name, phone, address)가 필요합니다.',
      });
    }

    const orderItems = [];
    let itemCount = 0;
    let totalAmount = 0;

    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          message: '장바구니에 존재하지 않는 상품이 있습니다.',
        });
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

    // 2) 결제수단이 있으면 paymentId + 포트원 PAID 검증 필수
    const needsPayment = paymentMethod && paymentMethod !== 'none';

    if (needsPayment) {
      if (!normalizedPaymentId) {
        return res.status(400).json({
          message: '결제 검증을 위해 paymentId가 필요합니다.',
        });
      }

      try {
        await verifyPaidPayment(normalizedPaymentId, totalAmount);
      } catch (verifyErr) {
        return res.status(verifyErr.status || 400).json({
          message: verifyErr.message || '결제 검증에 실패했습니다.',
          paymentStatus: verifyErr.paymentStatus,
          detail: verifyErr.payload,
        });
      }
    }

    const order = await Order.create({
      orderNo: buildOrderNo(),
      user: userId,
      items: orderItems,
      itemCount,
      totalAmount,
      shipping: shippingInfo,
      orderStatus: '주문확인',
      paymentMethod,
      paymentId: normalizedPaymentId,
    });

    cart.items = [];
    await cart.save();

    const populated = await getPopulatedOrder(order._id, userId);

    res.status(201).json({
      message: '주문이 완료되었습니다.',
      order: populated,
    });
  } catch (error) {
    next(error);
  }
}

// Read all — 내 주문 목록
// GET /api/orders
async function getOrders(req, res, next) {
  try {
    const userId = getUserId(req);
    const isAdmin = req.user?.user_type === 'admin';

    const filter = isAdmin ? {} : { user: userId };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.product', 'sku name price category image description')
      .populate('user', 'name email phone address');

    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

// Read my orders — 상품 상세 포함, 최신순
// GET /api/orders/my
async function getMyOrders(req, res, next) {
  try {
    const userId = getUserId(req);
    const orders = await Order.findByUserWithDetails(userId);
    res.json({ orders });
  } catch (error) {
    next(error);
  }
}

// Read one — 주문 상세
// GET /api/orders/:id
async function getOrderById(req, res, next) {
  try {
    const userId = getUserId(req);
    const isAdmin = req.user?.user_type === 'admin';

    const order = await getPopulatedOrder(
      req.params.id,
      isAdmin ? undefined : userId
    );

    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
}

// Update — 주문 상태/배송정보 수정
// PUT /api/orders/:id
// body: { orderStatus?, status?, shipping?, paymentMethod? }
async function updateOrder(req, res, next) {
  try {
    const userId = getUserId(req);
    const isAdmin = req.user?.user_type === 'admin';
    const { orderStatus, status, shipping, paymentMethod } = req.body;
    const nextStatus = orderStatus ?? status;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (!isAdmin && String(order.user) !== String(userId)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    if (nextStatus !== undefined) {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: '주문 상태 변경은 관리자만 가능합니다.' });
      }
      order.orderStatus = nextStatus;
    }

    if (paymentMethod !== undefined) {
      order.paymentMethod = paymentMethod;
    }

    if (shipping) {
      order.shipping = {
        name: shipping.name || order.shipping.name,
        phone: shipping.phone || order.shipping.phone,
        address: shipping.address || order.shipping.address,
      };
    }

    await order.save();

    const populated = await getPopulatedOrder(
      order._id,
      isAdmin ? undefined : userId
    );

    res.json({
      message: '주문이 수정되었습니다.',
      order: populated,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

// Delete — 주문 취소(삭제)
// DELETE /api/orders/:id
async function deleteOrder(req, res, next) {
  try {
    const userId = getUserId(req);
    const isAdmin = req.user?.user_type === 'admin';

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (!isAdmin && String(order.user) !== String(userId)) {
      return res.status(403).json({ message: '권한이 없습니다.' });
    }

    if (!isAdmin && !['주문확인', '상품준비중'].includes(order.orderStatus)) {
      return res.status(400).json({
        message: '배송이 시작된 주문은 취소할 수 없습니다.',
      });
    }

    await order.deleteOne();

    res.json({ message: '주문이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
