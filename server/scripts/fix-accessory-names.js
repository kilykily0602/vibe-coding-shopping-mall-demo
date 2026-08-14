/**
 * 악세사리 상품명/이미지 불일치 수정
 * 실행: node scripts/fix-accessory-names.js
 */
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product");

// 이미지에 맞게 상품명(및 깨진 이미지 URL) 수정
const RENAMES = [
  {
    sku: "SND-ACC-073529-01",
    name: "Mizuho 퀼팅 체인백",
    description: "Mizuho 퀼팅 체인백. 룩을 완성하는 Mizuho 스타일 악세사리입니다.",
  },
  {
    sku: "SND-ACC-073529-02",
    name: "Mizuho 레더 위브백",
    description: "Mizuho 레더 위브백. 룩을 완성하는 Mizuho 스타일 악세사리입니다.",
  },
  {
    sku: "SND-ACC-073529-03",
    name: "Mizuho 블루 주얼 이어링",
    description: "Mizuho 블루 주얼 이어링. 룩을 완성하는 Mizuho 스타일 악세사리입니다.",
  },
  {
    sku: "SND-ACC-073529-04",
    name: "Mizuho 레더백",
    description: "Mizuho 레더백. 룩을 완성하는 Mizuho 스타일 악세사리입니다.",
  },
  {
    sku: "SND-ACC-073529-05",
    name: "Mizuho 수정링",
    description: "Mizuho 수정링. 룩을 완성하는 Mizuho 스타일 악세사리입니다.",
  },
  {
    sku: "SND-ACC-073529-06",
    name: "Mizuho 선글라스",
    description: "Mizuho 선글라스. 룩을 완성하는 Mizuho 스타일 악세사리입니다.",
  },
  {
    sku: "SND-ACC-073529-07",
    name: "Mizuho 울 베레모",
    image:
      "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?auto=format&fit=crop&w=800&q=80",
    description: "Mizuho 울 베레모. 룩을 완성하는 Mizuho 스타일 악세사리입니다.",
  },
  {
    sku: "SND-ACC-073529-08",
    name: "Mizuho 골드 펜던트 네크리스",
    description:
      "Mizuho 골드 펜던트 네크리스. 룩을 완성하는 Mizuho 스타일 악세사리입니다.",
  },
];

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/shoping-mall-demo";

  await mongoose.connect(uri);
  console.log("MongoDB connected");

  let updated = 0;

  for (const item of RENAMES) {
    const { sku, ...fields } = item;
    const result = await Product.updateOne({ sku }, { $set: fields });
    if (result.modifiedCount > 0 || result.matchedCount > 0) {
      console.log(`${sku} → ${fields.name}`);
      updated += result.modifiedCount;
    } else {
      console.log(`skip (not found): ${sku}`);
    }
  }

  console.log(`updated documents: ${updated}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
