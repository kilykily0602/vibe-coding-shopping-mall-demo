/**
 * 미즈호(Mizuho) 스타일 데모 상품 시드
 * 실행: node scripts/seed-sandro-products.js
 */
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/product");

const TOPS = [
  "Mizuho 울 크롭 블레이저",
  "Mizuho 오버사이즈 트렌치 코트",
  "Mizuho 실크 블라우스",
  "Mizuho 린넨 셔츠",
  "Mizuho 케이블 니트 스웨터",
  "Mizuho 터틀넥 니트",
  "Mizuho 크롭 가디건",
  "Mizuho 벨벳 탑",
  "Mizuho 플리츠 슬리브리스",
  "Mizuho 코튼 포플린 셔츠",
  "Mizuho 브이넥 니트 베스트",
  "Mizuho 패딩 베스트",
  "Mizuho 더블 브레스티드 자켓",
  "Mizuho 보우 디테일 블라우스",
  "Mizuho 메쉬 니트 톱",
  "Mizuho 테일러드 숏 코트",
];

const BOTTOMS = [
  "Mizuho 하이웨이스트 와이드 팬츠",
  "Mizuho 핀턱 슬랙스",
  "Mizuho 플리츠 미디 스커트",
  "Mizuho 데님 스트레이트 진",
  "Mizuho 가죽 미니 스커트",
  "Mizuho 크롭 데님",
  "Mizuho 벨트 와이드 팬츠",
  "Mizuho A라인 롱 스커트",
  "Mizuho 테일러드 쇼츠",
  "Mizuho 울 플리츠 팬츠",
  "Mizuho 카고 팬츠",
  "Mizuho 펜슬 스커트",
  "Mizuho 조거 팬츠",
  "Mizuho 체크 와이드 팬츠",
  "Mizuho 새틴 슬립 팬츠",
  "Mizuho 로우라이즈 진",
];

// 이름 ↔ 이미지 매칭
const ACCESSORIES = [
  {
    name: "Mizuho 퀼팅 체인백",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mizuho 레더 위브백",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mizuho 블루 주얼 이어링",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mizuho 레더백",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mizuho 수정링",
    image:
      "https://images.unsplash.com/photo-1608042314453-ae338d80c427?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mizuho 선글라스",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mizuho 울 베레모",
    image:
      "https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Mizuho 골드 펜던트 네크리스",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
  },
];

const TOP_IMAGES = [
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
];

const BOTTOM_IMAGES = [
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list, index) {
  return list[index % list.length];
}

function buildProducts() {
  const stamp = Date.now().toString().slice(-6);
  const products = [];

  TOPS.forEach((name, index) => {
    products.push({
      sku: `MZH-TOP-${stamp}-${String(index + 1).padStart(2, "0")}`,
      name,
      price: randomInt(189000, 589000),
      category: "상의",
      image: pick(TOP_IMAGES, index),
      description: `${name}. 파리 감성의 Mizuho 스타일 상의입니다.`,
    });
  });

  BOTTOMS.forEach((name, index) => {
    products.push({
      sku: `MZH-BTM-${stamp}-${String(index + 1).padStart(2, "0")}`,
      name,
      price: randomInt(159000, 459000),
      category: "하의",
      image: pick(BOTTOM_IMAGES, index),
      description: `${name}. 세련된 실루엣의 Mizuho 스타일 하의입니다.`,
    });
  });

  ACCESSORIES.forEach((item, index) => {
    products.push({
      sku: `MZH-ACC-${stamp}-${String(index + 1).padStart(2, "0")}`,
      name: item.name,
      price: randomInt(79000, 329000),
      category: "악세사리",
      image: item.image,
      description: `${item.name}. 룩을 완성하는 Mizuho 스타일 악세사리입니다.`,
    });
  });

  return products;
}

async function seed() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI가 설정되지 않았습니다.");
  }

  await mongoose.connect(uri);

  const docs = buildProducts();
  const result = await Product.insertMany(docs);

  const tops = result.filter((item) => item.category === "상의").length;
  const bottoms = result.filter((item) => item.category === "하의").length;
  const accessories = result.filter((item) => item.category === "악세사리").length;

  console.log(`미즈호 시드 완료: ${result.length}개 추가`);
  console.log(`- 상의: ${tops}개`);
  console.log(`- 하의: ${bottoms}개`);
  console.log(`- 악세사리: ${accessories}개`);

  const total = await Product.countDocuments();
  console.log(`현재 DB 총 상품 수: ${total}개`);
}

seed()
  .catch((error) => {
    console.error("시드 실패:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
