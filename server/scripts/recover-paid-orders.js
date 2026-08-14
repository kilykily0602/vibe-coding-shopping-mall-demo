/**
 * 포트원 PAID 결제 중 DB에 없는 건을 주문으로 복구
 * 실행: node scripts/recover-paid-orders.js
 */
require("dotenv").config();

const mongoose = require("mongoose");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");

function buildOrderNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `ORD-${y}${m}${d}-${rand}`;
}

async function listPaidPayments(secret) {
  const res = await fetch("https://api.portone.io/payments", {
    headers: { Authorization: `PortOne ${secret}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "결제 목록 조회 실패");
  }
  return (data.items || []).filter((item) => item.status === "PAID");
}

async function main() {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) throw new Error("PORTONE_API_SECRET 없음");

  await mongoose.connect(process.env.MONGODB_URI);

  const paid = await listPaidPayments(secret);
  const sticker = await Product.findOne({ name: "Mizuho 스티커" });
  const users = await User.find({}).sort({ createdAt: 1 });

  if (!users.length) throw new Error("유저가 없습니다.");

  // 데모: 비관리자 유저 우선, 없으면 첫 유저
  const buyer =
    users.find((u) => u.user_type !== "admin") || users[users.length - 1];

  let created = 0;

  for (const payment of paid) {
    const paymentId = payment.id;
    const amount = Number(payment.amount?.total ?? payment.amount ?? 0);
    const existing = await Order.findOne({ paymentId });
    if (existing) {
      console.log("skip existing", paymentId, existing.orderNo);
      continue;
    }

    let product = null;
    if (amount === 5000 && sticker) {
      product = sticker;
    } else {
      product = await Product.findOne({ price: amount });
    }

    if (!product) {
      console.log("skip no product match", paymentId, amount);
      continue;
    }

    const order = await Order.create({
      orderNo: buildOrderNo(),
      user: buyer._id,
      items: [{ product: product._id, quantity: 1 }],
      itemCount: 1,
      totalAmount: amount,
      shipping: {
        name: buyer.name || "구매자",
        phone: buyer.phone || "01000000000",
        address: buyer.address || "주소 미입력",
      },
      orderStatus: "주문확인",
      paymentMethod: "card",
      paymentId,
    });

    console.log(
      "created",
      order.orderNo,
      paymentId,
      amount,
      product.name,
      "user",
      buyer.email || buyer.name
    );
    created += 1;
  }

  console.log("done created=", created, "paidTotal=", paid.length);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
