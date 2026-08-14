const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('../../routes/user.route');
const productRoutes = require('../../routes/product.route');
const cartRoutes = require('../../routes/cart.route');
const orderRoutes = require('../../routes/order.route');
const paymentRoutes = require('../../routes/payment.route');

const router = express.Router();

router.get('/health', (req, res) => {
  const host = mongoose.connection.host || '';
  res.json({
    status: 'ok',
    message: 'Shopping mall API is running',
    timestamp: new Date().toISOString(),
    mongo: {
      readyState: mongoose.connection.readyState,
      host,
      db: mongoose.connection.name || '',
      isAtlas: host.includes('mongodb.net'),
    },
  });
});

router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;
