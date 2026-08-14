/**
 * 상품 갤러리를 라이프스타일 컷 포함 구성으로 갱신한다.
 * 실행: node scripts/migrate-product-galleries.js
 */
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product");
const { buildSameProductGallery } = require("../utils/productGallery");

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/shoping-mall-demo";

  await mongoose.connect(uri);
  console.log("MongoDB connected");

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.VITE_CLOUDINARY_CLOUD_NAME ||
    "kcumhvgu";

  const products = await Product.find({});
  let updated = 0;

  for (const product of products) {
    const gallery = buildSameProductGallery(
      product.image,
      product.category,
      String(product._id),
      cloudName
    );
    if (!gallery.length) continue;

    product.images = gallery;
    await product.save();
    updated += 1;
  }

  console.log(`Updated galleries for ${updated} / ${products.length} products`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
