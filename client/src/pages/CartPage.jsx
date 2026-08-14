import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function CartPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const meRes = await fetch("/api/users/me", {
          headers: getAuthHeaders(),
        });

        if (!meRes.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }

        const me = await meRes.json();
        if (!cancelled) setUser(me);

        const cartRes = await fetch("/api/cart", {
          headers: getAuthHeaders(),
        });
        const cartData = await cartRes.json();

        if (!cartRes.ok) {
          throw new Error(cartData.message || "장바구니를 불러오지 못했습니다.");
        }

        if (!cancelled) setCart(cartData.cart);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "장바구니를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const items = cart?.items || [];

  const summary = useMemo(() => {
    const quantity = items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );
    const total = items.reduce((sum, item) => {
      const price = Number(item.product?.price || 0);
      return sum + price * (Number(item.quantity) || 0);
    }, 0);

    return { quantity, total };
  }, [items]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    setBusyId(productId);
    setError("");

    try {
      const res = await fetch(`/api/cart/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "수량 변경에 실패했습니다.");
      }

      setCart(data.cart);
    } catch (err) {
      setError(err.message || "수량 변경에 실패했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const removeItem = async (productId) => {
    setBusyId(productId);
    setError("");

    try {
      const res = await fetch(`/api/cart/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "상품 삭제에 실패했습니다.");
      }

      setCart(data.cart);
    } catch (err) {
      setError(err.message || "상품 삭제에 실패했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const clearCart = async () => {
    if (!window.confirm("장바구니를 비울까요?")) return;

    setBusyId("clear");
    setError("");

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "장바구니 비우기에 실패했습니다.");
      }

      setCart(data.cart);
    } catch (err) {
      setError(err.message || "장바구니 비우기에 실패했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      setError("장바구니가 비어 있습니다.");
      return;
    }
    navigate("/checkout");
  };

  const isEmpty = !loading && items.length === 0;

  return (
    <div className="mall cart-page">
      <Navbar
        user={user}
        loading={authLoading}
        onLogout={handleLogout}
        cartCount={summary.quantity}
      />

      <main className="cart-page__main">
        <header className="cart-page__header">
          <div className="cart-page__header-left">
            <button
              type="button"
              className="cart-page__back"
              onClick={() => navigate(-1)}
              aria-label="이전으로"
            >
              ←
            </button>
            <h1 className="cart-page__title">장바구니</h1>
          </div>

          {!isEmpty && (
            <button
              type="button"
              className="cart-page__clear"
              onClick={clearCart}
              disabled={busyId === "clear"}
            >
              장바구니 비우기
            </button>
          )}
        </header>

        {loading && (
          <div className="cart-page__panel cart-page__panel--status">
            <p>불러오는 중...</p>
          </div>
        )}

        {error && <p className="cart-page__error">{error}</p>}

        {isEmpty && (
          <section className="cart-page__panel cart-page__empty">
            <div className="cart-page__empty-icon" aria-hidden="true">
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="17" cy="20" r="1.4" />
                <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L20 8H7" />
              </svg>
            </div>
            <h2 className="cart-page__empty-title">장바구니가 비어있습니다</h2>
            <p className="cart-page__empty-desc">
              마음에 드는 상품을 장바구니에 담아보세요!
            </p>
            <Link to="/" className="cart-page__cta">
              쇼핑 계속하기
            </Link>
          </section>
        )}

        {!loading && items.length > 0 && (
          <div className="cart-page__layout">
            <ul className="cart-page__list">
              {items.map((item) => {
                const productId = item.product?._id || item.product;
                const unitPrice = Number(item.product?.price || 0);
                const lineTotal = unitPrice * Number(item.quantity || 0);
                const disabled = busyId === productId || busyId === "clear";

                return (
                  <li key={productId} className="cart-page__card">
                    <Link
                      to={`/products/${productId}`}
                      className="cart-page__thumb-wrap"
                    >
                      {item.product?.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="cart-page__thumb"
                        />
                      ) : (
                        <div className="cart-page__thumb cart-page__thumb--empty" />
                      )}
                    </Link>

                    <div className="cart-page__meta">
                      <Link
                        to={`/products/${productId}`}
                        className="cart-page__name"
                      >
                        {item.product?.name || "상품"}
                      </Link>
                      <p className="cart-page__sku">
                        {item.product?.sku || "-"}
                      </p>
                      <p className="cart-page__unit">
                        ₩{unitPrice.toLocaleString()}
                      </p>

                      <div className="cart-page__qty">
                        <button
                          type="button"
                          disabled={disabled || item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(productId, item.quantity - 1)
                          }
                          aria-label="수량 감소"
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            updateQuantity(productId, item.quantity + 1)
                          }
                          aria-label="수량 증가"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cart-page__side">
                      <strong className="cart-page__line-total">
                        ₩{lineTotal.toLocaleString()}
                      </strong>
                      <button
                        type="button"
                        className="cart-page__delete"
                        disabled={disabled}
                        onClick={() => removeItem(productId)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="cart-page__summary">
              <h2>주문 요약</h2>

              <div className="cart-page__summary-row">
                <span>상품 수량 ({summary.quantity}개)</span>
                <strong>₩{summary.total.toLocaleString()}</strong>
              </div>

              <div className="cart-page__summary-row">
                <span>배송비</span>
                <strong className="cart-page__free">무료</strong>
              </div>

              <div className="cart-page__summary-total">
                <span>총 결제금액</span>
                <strong>₩{summary.total.toLocaleString()}</strong>
              </div>

              <button
                type="button"
                className="cart-page__pay"
                onClick={handleCheckout}
                disabled={busyId === "clear"}
              >
                결제하기
              </button>
              <Link to="/" className="cart-page__continue">
                쇼핑 계속하기
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default CartPage;
