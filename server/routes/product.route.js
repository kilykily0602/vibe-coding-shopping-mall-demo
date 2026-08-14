const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

// POST /api/products - 상품 등록
router.post('/', productController.createProduct);

// GET /api/products - 상품 조회
// 전체(한번에): /api/products?all=true
// 페이지네이션: /api/products?page=1&limit=20 (기본 20개)
router.get('/', productController.getProducts);

// GET /api/products/:id - 상품 단일 조회
router.get('/:id', productController.getProductById);

// PUT /api/products/:id - 상품 수정
router.put('/:id', productController.updateProduct);

// DELETE /api/products/:id - 상품 삭제
router.delete('/:id', productController.deleteProduct);

module.exports = router;
