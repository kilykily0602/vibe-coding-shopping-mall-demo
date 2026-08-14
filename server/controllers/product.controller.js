const Product = require('../models/product');
const { buildSameProductGallery } = require('../utils/productGallery');

function normalizeImages(image, images, category = '상의', seedKey = '') {
  const list = Array.isArray(images)
    ? images.filter((url) => typeof url === 'string' && url.trim())
    : [];

  // 예전 gen-배경 변환 URL은 장면 차이가 약해서 재생성한다
  const looksLikeOldGenGallery =
    list.length > 0 &&
    list.every(
      (url) =>
        url === image ||
        url.includes('e_gen_background_replace') ||
        url.includes('c_fill,g_auto,z_')
    );

  if (list.length > 0 && !looksLikeOldGenGallery) {
    return list.slice(0, 6);
  }

  if (image) {
    return buildSameProductGallery(
      image,
      category,
      seedKey || image,
      process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
    );
  }

  return [];
}

// Create
async function createProduct(req, res, next) {
  try {
    const { sku, name, price, category, image, images, description } = req.body;

    if (!sku || !name || price === undefined || !category || !image) {
      return res.status(400).json({
        message: 'sku, name, price, category, image는 필수입니다.',
      });
    }

    const gallery = normalizeImages(image, images, category, sku);

    const product = await Product.create({
      sku,
      name,
      price,
      category,
      image,
      images: gallery,
      description,
    });

    res.status(201).json({
      message: '상품이 등록되었습니다.',
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '이미 사용 중인 SKU입니다.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
}

// Read all
// - 페이지네이션: /api/products?page=1&limit=20 (기본 20개)
// - 전체 조회: /api/products?all=true  (MainPage용)
async function getProducts(req, res, next) {
  try {
    const filter = {};

    if (req.query.category && req.query.category !== '전체') {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      filter.name = { $regex: String(req.query.search).trim(), $options: 'i' };
    }

    // 전체 상품 조회 (페이지네이션 없이)
    if (req.query.all === 'true') {
      const products = await Product.find(filter).sort({ createdAt: -1 });
      return res.json({
        products,
        total: products.length,
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Read one
async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const payload = product.toObject();
    payload.images = normalizeImages(
      payload.image,
      payload.images,
      payload.category,
      payload._id || payload.sku
    );

    res.json(payload);
  } catch (error) {
    next(error);
  }
}

// Update
async function updateProduct(req, res, next) {
  try {
    const allowedFields = [
      'sku',
      'name',
      'price',
      'category',
      'image',
      'images',
      'description',
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.image || updates.images) {
      const nextImage = updates.image;
      const nextImages = updates.images;
      // image만 바뀐 경우에도 갤러리를 다시 생성
      const current = await Product.findById(req.params.id).lean();
      if (!current) {
        return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
      }
      updates.images = normalizeImages(
        nextImage || current.image,
        nextImages !== undefined ? nextImages : current.images,
        updates.category || current.category,
        current._id || current.sku
      );
      if (!updates.image && updates.images[0]) {
        updates.image = updates.images[0];
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: '이미 사용 중인 SKU입니다.' });
    }
    next(error);
  }
}

// Delete
async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    res.json({ message: '상품이 삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
