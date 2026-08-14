const express = require('express');
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', cartController.addToCart);
router.get('/', cartController.getCart);
router.put('/:productId', cartController.updateCartItem);
router.delete('/', cartController.clearCart);
router.delete('/:productId', cartController.removeCartItem);

module.exports = router;
