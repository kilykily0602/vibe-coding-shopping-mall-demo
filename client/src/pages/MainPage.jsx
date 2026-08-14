import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import ProductCard from "../components/ProductCard";
import {
  HERO_IMAGE,
  LOOKBOOK_IMAGES,
  STYLE_THUMBS,
} from "../data/homeData";

function MainPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchMe = async () => {
      try {
        const res = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (!cancelled) setUser(null);
          return;
        }

        const data = await res.json();
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMe();

    return () => {
      cancelled = true;
    };
  }, []);

  // GET /api/products?all=true → 전체 상품 조회
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError("");

      try {
        const res = await fetch("/api/products?all=true");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "상품을 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setProductsError(err.message || "상품을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const productCards = products.map((product) => ({
    id: product._id,
    brand: "MIZUHO",
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category,
  }));

  const recommended = productCards.slice(0, 4);

  return (
    <div className="mall">
      <Navbar user={user} loading={loading} onLogout={handleLogout} />

      <section className="mall-hero">
        <img
          src={HERO_IMAGE}
          alt="New collection campaign"
          fetchPriority="high"
          decoding="async"
        />
        <div className="mall-hero__copy">
          <p>NEW COLLECTION</p>
          <h1>PARISIAN SUMMER</h1>
        </div>
      </section>

      <div className="mall-banner">
        지금 MIZUHO 멤버십 가입 시 시즌 한정 기프트 증정
      </div>

      <section className="mall-section" id="new">
        <h2 className="mall-section__title mall-section__title--left">
          NEW ARRIVALS
        </h2>

        {productsLoading && (
          <p className="mall-section__status">상품을 불러오는 중...</p>
        )}

        {productsError && (
          <p className="mall-section__status mall-section__status--error">
            {productsError}
          </p>
        )}

        {!productsLoading && !productsError && productCards.length === 0 && (
          <p className="mall-section__status">등록된 상품이 없습니다.</p>
        )}

        {!productsLoading && productCards.length > 0 && (
          <div className="mall-grid mall-grid--5">
            {productCards.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="mall-section" id="woman">
        <h2 className="mall-section__title">RECOMMENDED</h2>
        {!productsLoading && recommended.length > 0 ? (
          <div className="mall-grid mall-grid--4">
            {recommended.map((item) => (
              <ProductCard key={`rec-${item.id}`} item={item} tall />
            ))}
          </div>
        ) : (
          <p className="mall-section__status">추천 상품을 준비 중입니다.</p>
        )}
      </section>

      <section className="mall-section">
        <h2 className="mall-section__title">MIZUHO의 스타일 추천 아이템</h2>
        <div className="style-row">
          {STYLE_THUMBS.map((src) => (
            <img
              key={src}
              src={src}
              alt="스타일 추천"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </section>

      <section className="mall-section mall-lookbook" id="lookbook">
        <h2 className="mall-section__title">LOOKBOOK</h2>
        <div className="lookbook-grid">
          {LOOKBOOK_IMAGES.map((image) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </section>

      <footer className="mall-footer">
        <div className="mall-footer__grid">
          <div>
            <h3>CUSTOMER CARE</h3>
            <p>1588-0000</p>
            <p>평일 10:00 - 18:00</p>
          </div>
          <div>
            <h3>ABOUT</h3>
            <p>Brand Story</p>
            <p>Store Locator</p>
          </div>
          <div>
            <h3>HELP</h3>
            <p>배송 안내</p>
            <p>교환/반품</p>
          </div>
        </div>
        <p className="mall-footer__copy">© MIZUHO DEMO SHOP</p>
      </footer>
    </div>
  );
}

export default MainPage;
