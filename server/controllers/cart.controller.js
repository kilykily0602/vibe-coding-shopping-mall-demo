const Cart = require('../models/cart');
const Product = require('../models/product');

function getUserId(req) {
  return req.user?.id;
}

async function findOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
}

async function getPopulatedCart(userId) {
  return Cart.findOne({ user: userId }).populate(
    'items.product',
    'sku name price category image description'
  );
}

async function addToCart(req, res, next) {
  try {
    const userId = getUserId(req);
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId는 필수입니다.' });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res
        .status(400)
        .json({ message: 'quantity는 1 이상의 정수여야 합니다.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const cart = await findOrCreateCart(userId);
    const existing = cart.items.find(
      (item) => String(item.product) === String(productId)
    );

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    const populated = await getPopulatedCart(userId);

    res.status(201).json({
      message: '장바구니에 담았습니다.',
      cart: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function getCart(req, res, next) {
  try {
    const userId = getUserId(req);
    let cart = await getPopulatedCart(userId);

    if (!cart) {
      await Cart.create({ user: userId, items: [] });
      cart = await getPopulatedCart(userId);
    }

    res.json({ cart });
  } catch (error) {
    next(error);
  }
}

async function updateCartItem(req, res, next) {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;
    const qty = Number(req.body.quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return res
        .status(400)
        .json({ message: 'quantity는 1 이상의 정수여야 합니다.' });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }

    const item = cart.items.find(
      (entry) => String(entry.product) === String(productId)
    );

    if (!item) {
      return res
        .status(404)
        .json({ message: '장바구니에 해당 상품이 없습니다.' });
    }

    item.quantity = qty;
    await cart.save();
    const populated = await getPopulatedCart(userId);

    res.json({
      message: '수량이 변경되었습니다.',
      cart: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function removeCartItem(req, res, next) {
  try {
    const userId = getUserId(req);
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }

    const before = cart.items.length;
    cart.items = cart.items.filter(
      (item) => String(item.product) !== String(productId)
    );

    if (cart.items.length === before) {
      return res
        .status(404)
        .json({ message: '장바구니에 해당 상품이 없습니다.' });
    }

    await cart.save();
    const populated = await getPopulatedCart(userId);

    res.json({
      message: '장바구니에서 상품을 삭제했습니다.',
      cart: populated,
    });
  } catch (error) {
    next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const userId = getUserId(req);
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: '장바구니를 찾을 수 없습니다.' });
    }

    cart.items = [];
    await cart.save();

    res.json({
      message: '장바구니를 비웠습니다.',
      cart,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
