const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const SALT_ROUNDS = 10;

// Create
async function createUser(req, res, next) {
  try {
    const { email, name, password, phone, user_type, address, marketing_agree } =
      req.body;
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
      phone,
      user_type,
      address,
      marketing_agree,
    });

    const result = user.toObject();
    delete result.password;

    res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    next(error);
  }
}

// Login
async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET이 설정되지 않았습니다.' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      }
    );

    const result = user.toObject();
    delete result.password;

    res.status(200).json({
      message: '로그인 성공',
      token,
      user: result,
    });
  } catch (error) {
    next(error);
  }
}

// Get current user by token
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

// Read all
async function getUsers(req, res, next) {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
}

// Read one
async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

// Update
async function updateUser(req, res, next) {
  try {
    const allowedFields = [
      'email',
      'name',
      'password',
      'phone',
      'user_type',
      'address',
      'marketing_agree',
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    next(error);
  }
}

// Delete
async function deleteUser(req, res, next) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    res.json({ message: '유저가 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
