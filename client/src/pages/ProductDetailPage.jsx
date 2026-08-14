import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";

const SIZES = ["XS", "S", "M", "L", "XL"];
const COLORS = [
  { id: "blue", label: "Medium Blue", value: "#5b7c99" },
  { id: "black", label: "Black", value: "#1a1a1a" },
  { id: "sky", label: "Light Blue", value: "#b7d3e8" },
];

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("ok");
  const [size, setSize] = useState("M");
  const [color, setColor] = useState(COLORS[0].id);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);

  const stockLeft = 5;
  const saleRate = 26;

  const priceInfo = useMemo(() => {
    const price = Number(product?.price || 0);
    const original = Math.round(price / (1 - saleRate / 100));
    return { price, original, saleRate };
  }, [product]);

  const thumbs = useMemo(() => {
    if (!product?.image) return [];
    // 메인 1장 + 플레이스홀더 3칸 (첨부 UI)
    return [product.image, null, null, null];
  }, [product]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    const fetchMe = async () => {
      try {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
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
        if (!cancelled) setAuthLoading(false);
      }
    };

    fetchMe();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      setActiveThumb(0);
      setQuantity(1);
      setSize("M");
      setColor(COLORS[0].id);
      setMessage("");

      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "상품을 불러오지 못했습니다.");
        }

        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) {
          setProduct(null);
          setError(err.message || "상품을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const changeQuantity = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > stockLeft) return stockLeft;
      return next;
    });
  };

  const handleAddToBag = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setAdding(true);
    setMessage("");

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "장바구니 담기에 실패했습니다.");
      }

      setMessageType("ok");
      setMessage("장바구니에 담았습니다.");
    } catch (err) {
      setMessageType("error");
      setMessage(err.message || "장바구니 담기에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = () => {
    setMessageType("ok");
    setMessage("위시리스트에 추가했습니다. (데모)");
  };

  const mainImage =
    thumbs[activeThumb] || product?.image || "";

  return (
    <div className="mall">
      <Navbar user={user} loading={authLoading} onLogout={handleLogout} />

      <main className="pd">
        {loading && <p className="pd__status">상품 정보를 불러오는 중...</p>}
        {error && <p className="pd__status pd__status--error">{error}</p>}

        {!loading && !error && product && (
          <section className="pd__layout">
            <div className="pd__gallery">
              <div className="pd__main-image">
                <img src={mainImage} alt={product.name} />
              </div>

              <div className="pd__thumbs" role="list">
                {thumbs.map((thumb, index) => {
                  const isActive = activeThumb === index;
                  const isPlaceholder = !thumb;

                  return (
                    <button
                      key={`thumb-${index}`}
                      type="button"
                      role="listitem"
                      className={
                        isActive ? "pd__thumb is-active" : "pd__thumb"
                      }
                      onClick={() => {
                        if (!isPlaceholder) setActiveThumb(index);
                      }}
                      disabled={isPlaceholder}
                      aria-label={`상품 이미지 ${index + 1}`}
                    >
                      {isPlaceholder ? (
                        <span className="pd__thumb-placeholder" aria-hidden="true">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          >
                            <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
                            <circle cx="12" cy="13" r="3.2" />
                          </svg>
                        </span>
                      ) : (
                        <img src={thumb} alt="" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pd__info">
              <div className="pd__badges">
                <span className="pd__badge pd__badge--new">NEW</span>
                <span className="pd__badge pd__badge--sale">SALE</span>
              </div>

              <h1 className="pd__name">{product.name}</h1>

              <div className="pd__rating">
                <span className="pd__star" aria-hidden="true">
                  ★
                </span>
                <strong>4.8</strong>
                <span className="pd__reviews">(124 reviews)</span>
              </div>

              <div className="pd__price-row">
                <strong className="pd__price">
                  ₩{priceInfo.price.toLocaleString()}
                </strong>
                <span className="pd__price-origin">
                  ₩{priceInfo.original.toLocaleString()}
                </span>
                <span className="pd__price-sale">{priceInfo.saleRate}% OFF</span>
              </div>

              <div className="pd__option">
                <p className="pd__option-label">Size</p>
                <div className="pd__sizes">
                  {SIZES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={
                        size === item ? "pd__size is-active" : "pd__size"
                      }
                      onClick={() => setSize(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pd__option">
                <p className="pd__option-label">
                  Color:{" "}
                  <span>
                    {COLORS.find((item) => item.id === color)?.label}
                  </span>
                </p>
                <div className="pd__colors">
                  {COLORS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        color === item.id
                          ? "pd__color is-active"
                          : "pd__color"
                      }
                      style={{ background: item.value }}
                      onClick={() => setColor(item.id)}
                      aria-label={item.label}
                    />
                  ))}
                </div>
              </div>

              <div className="pd__option">
                <p className="pd__option-label">Quantity</p>
                <div className="pd__qty-row">
                  <div className="pd__qty">
                    <button
                      type="button"
                      onClick={() => changeQuantity(-1)}
                      aria-label="수량 감소"
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(1)}
                      aria-label="수량 증가"
                    >
                      +
                    </button>
                  </div>
                  <p className="pd__stock">Only {stockLeft} left in stock</p>
                </div>
              </div>

              {message && (
                <p
                  className={
                    messageType === "error"
                      ? "pd__message pd__message--error"
                      : "pd__message"
                  }
                >
                  {message}
                </p>
              )}

              <button
                type="button"
                className="pd__btn pd__btn--bag"
                onClick={handleAddToBag}
                disabled={adding}
              >
                {adding
                  ? "ADDING..."
                  : `ADD TO BAG - ₩${(
                      priceInfo.price * quantity
                    ).toLocaleString()}`}
              </button>

              <button
                type="button"
                className="pd__btn pd__btn--wish"
                onClick={handleWishlist}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
                </svg>
                ADD TO WISHLIST
              </button>

              <div className="pd__trust">
                <div>
                  <span className="pd__trust-icon pd__trust-icon--ship" />
                  <strong>Free Shipping</strong>
                  <p>On orders over $100</p>
                </div>
                <div>
                  <span className="pd__trust-icon pd__trust-icon--return" />
                  <strong>Easy Returns</strong>
                  <p>30-day return policy</p>
                </div>
                <div>
                  <span className="pd__trust-icon pd__trust-icon--pay" />
                  <strong>Secure Payment</strong>
                  <p>SSL encrypted</p>
                </div>
              </div>

              {product.description && (
                <div className="pd__desc">
                  <h2>상품 설명</h2>
                  <p>{product.description}</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {!loading && !error && product && (
        <div className="pd__sticky-bag">
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={adding}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M6 8h12l-1 12H7L6 8z" />
              <path d="M9 8V7a3 3 0 0 1 6 0v1" />
            </svg>
            {adding
              ? "ADDING..."
              : `ADD TO BAG - ₩${(priceInfo.price * quantity).toLocaleString()}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductDetailPage;
