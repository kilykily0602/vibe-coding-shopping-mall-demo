const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 유저 생성
router.post('/', userController.createUser);

// 유저 로그인
router.post('/login', userController.loginUser);

// 토큰으로 내 정보 조회
router.get('/me', authMiddleware, userController.getMe);

// 유저 전체 조회
router.get('/', userController.getUsers);

// 유저 단일 조회
router.get('/:id', userController.getUserById);

// 유저 수정
router.put('/:id', userController.updateUser);

// 유저 삭제
router.delete('/:id', userController.deleteUser);

module.exports = router;
