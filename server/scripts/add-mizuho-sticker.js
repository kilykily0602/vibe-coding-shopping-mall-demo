/**
 * Mizuho 스티커 상품 추가
 * 실행: node scripts/add-mizuho-sticker.js
 */
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI가 설정되지 않았습니다.");
  }

  await mongoose.connect(uri);

  const sku = "MZH-ACC-STICKER-01";
  const payload = {
    sku,
    name: "Mizuho 스티커",
    price: 5000,
    category: "악세사리",
    image: "/products/mizuho-sticker.png",
    images: ["/products/mizuho-sticker.png"],
    description: "50 x 50 mm Mizuho 로고 스티커.",
  };

  const existing = await Product.findOne({
    $or: [{ sku }, { name: "Mizuho 스티커" }],
  });

  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    console.log("updated", existing._id.toString());
  } else {
    const created = await Product.create(payload);
    console.log("created", created._id.toString());
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
