/**
 * DB 상품명/설명의 Sandro → Mizuho 치환
 * 실행: node scripts/rename-sandro-to-mizuho.js
 */
require('dotenv').config();

const mongoose = require('mongoose');
const Product = require('../models/product');

async function rename() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI가 설정되지 않았습니다.');
  }

  await mongoose.connect(uri);

  const products = await Product.find({
    $or: [{ name: /Sandro/i }, { description: /Sandro/i }],
  });

  let updated = 0;

  for (const product of products) {
    const nextName = product.name.replace(/Sandro/gi, 'Mizuho');
    const nextDescription = (product.description || '').replace(/Sandro/gi, 'Mizuho');

    if (nextName !== product.name || nextDescription !== product.description) {
      product.name = nextName;
      product.description = nextDescription;
      await product.save();
      updated += 1;
    }
  }

  console.log(`Sandro → Mizuho 변경 완료: ${updated}개`);
}

rename()
  .catch((error) => {
    console.error('변경 실패:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
