/**
 * 상세 갤러리:
 * 1) 원본 상품
 * 2) 같은 상품 디테일 크롭
 * 3~6) 카테고리별 라이프스타일/착용/다른 앵글 컷 (참고 PDP처럼 장면이 구분되도록)
 */

const TOP_SCENES = [
  // 모델 착용
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80",
  // 스트리트 스타일
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80",
  // 디테일/텍스처
  "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80",
  // 인테리어 스타일링
  "https://images.unsplash.com/photo-1467043237213-65f2da53396f?auto=format&fit=crop&w=1000&q=80",
  // 풀샷 분위기
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=80",
  // 다른 각도/클로즈
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=80",
];

const BOTTOM_SCENES = [
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80",
];

const ACCESSORY_SCENES = [
  // 가방/모델
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80",
];

function hashSeed(value) {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function scenesForCategory(category) {
  if (category === "하의") return BOTTOM_SCENES;
  if (category === "악세사리") return ACCESSORY_SCENES;
  return TOP_SCENES;
}

function pickScenes(category, seedKey, count = 4) {
  const pool = scenesForCategory(category);
  if (!pool.length) return [];

  const start = hashSeed(seedKey) % pool.length;
  const picked = [];

  for (let i = 0; i < count; i += 1) {
    picked.push(pool[(start + i) % pool.length]);
  }

  return picked;
}

function applyCloudinaryUploadTransform(imageUrl, transform) {
  if (!transform) return imageUrl;
  return imageUrl.replace("/upload/", `/upload/${transform}/`);
}

function buildCloudinaryFetchUrl(cloudName, imageUrl, transform) {
  const encoded = encodeURIComponent(imageUrl);
  const base = `https://res.cloudinary.com/${cloudName}/image/fetch`;
  return transform
    ? `${base}/${transform}/${encoded}`
    : `${base}/${encoded}`;
}

function buildDetailCrop(imageUrl, cloudName = "") {
  const transform = "c_fill,g_auto,z_1.75,w_1000,h_1250,q_auto,f_auto";

  if (
    imageUrl.includes("res.cloudinary.com") &&
    imageUrl.includes("/upload/")
  ) {
    return applyCloudinaryUploadTransform(imageUrl, transform);
  }

  if (cloudName) {
    return buildCloudinaryFetchUrl(cloudName, imageUrl, transform);
  }

  return imageUrl;
}

function uniqueUrls(urls) {
  const seen = new Set();
  const result = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}

function buildSameProductGallery(
  imageUrl,
  category = "상의",
  seedKey = "",
  cloudName = ""
) {
  if (!imageUrl) return [];

  const detail = buildDetailCrop(imageUrl, cloudName);
  const lifestyle = pickScenes(category, seedKey || imageUrl, 4);

  return uniqueUrls([imageUrl, detail, ...lifestyle]).slice(0, 6);
}

function buildFallbackGallery(imageUrl, category = "상의", seedKey = "") {
  return buildSameProductGallery(imageUrl, category, seedKey, "");
}

module.exports = {
  buildSameProductGallery,
  buildFallbackGallery,
};
