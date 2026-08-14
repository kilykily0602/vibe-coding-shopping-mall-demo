require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shoping-mall-demo';

const map = {
  pending: '주문확인',
  paid: '주문확인',
  preparing: '상품준비중',
  shipped: '배송중',
  delivered: '배송완료',
  cancelled: '주문취소',
};

const valid = ['주문확인', '상품준비중', '배송시작', '배송중', '배송완료', '주문취소'];

(async () => {
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('orders');
  const docs = await col.find({}).toArray();
  let updated = 0;

  for (const doc of docs) {
    let next = doc.orderStatus;
    if (!next && doc.status) next = map[doc.status] || '주문확인';
    if (!next) next = '주문확인';
    if (!valid.includes(next)) next = '주문확인';

    const res = await col.updateOne(
      { _id: doc._id },
      { $set: { orderStatus: next }, $unset: { status: '' } }
    );
    if (res.modifiedCount) updated += 1;
  }

  console.log('orders=', docs.length, 'updated=', updated);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
