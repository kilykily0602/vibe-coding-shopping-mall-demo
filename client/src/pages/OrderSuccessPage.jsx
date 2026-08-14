import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";

const PAYMENT_LABEL = {
  card: "신용카드",
  bank: "계좌이체",
  kakao: "카카오페이",
  naver: "네이버페이",
  none: "-",
};

function formatOrderDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function OrderSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meRes.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }

        const me = await meRes.json();
        if (!cancelled) setUser(me);

        const res = await fetch(`/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "주문 정보를 불러오지 못했습니다.");
        }

        if (!cancelled) setOrder(data.order);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "주문 정보를 불러오지 못했습니다.");
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
  }, [id, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <div className="mall order-result-page">
      <Navbar user={user} loading={authLoading} onLogout={handleLogout} />

      <main className="order-result-page__main">
        <p className="order-result-page__eyebrow">Order Confirmation</p>

        {loading && <p className="order-result-page__status">불러오는 중...</p>}

        {!loading && error && (
          <section className="order-result-page__hero">
            <div
              className="order-result-page__icon order-result-page__icon--fail"
              aria-hidden="true"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 7l10 10M17 7L7 17"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1>주문을 확인할 수 없습니다</h1>
            <p className="order-result-page__sub">{error}</p>
            <div className="order-result-page__actions">
              <Link to="/orders" className="order-result-page__btn">
                주문목록보기
              </Link>
            </div>
          </section>
        )}

        {!loading && !error && order && (
          <section className="order-result-page__hero">
            <div
              className="order-result-page__icon order-result-page__icon--ok"
              aria-hidden="true"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1>주문이 성공적으로 완료되었습니다!</h1>
            <p className="order-result-page__sub">
              주문해 주셔서 감사합니다. 주문 확인 이메일을 곧 받으실 수
              있습니다.
            </p>

            <div className="order-result-page__panel">
              <h2>주문 정보</h2>

              <div className="order-result-page__row">
                <span>주문 번호</span>
                <strong>{order.orderNo}</strong>
              </div>
              <div className="order-result-page__row">
                <span>주문 날짜</span>
                <strong>{formatOrderDate(order.createdAt)}</strong>
              </div>
              <div className="order-result-page__row">
                <span>결제 수단</span>
                <strong>
                  {PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}
                </strong>
              </div>

              <ul className="order-result-page__items">
                {(order.items || []).map((item) => (
                  <li key={item.product?._id || item.product}>
                    {item.product?.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product?.name || "상품"}
                      />
                    ) : (
                      <div className="order-result-page__thumb" />
                    )}
                    <div className="order-result-page__item-body">
                      <strong>{item.product?.name || "상품"}</strong>
                      <p>수량: {item.quantity}</p>
                      {item.product?.price != null && (
                        <p className="order-result-page__item-price">
                          ₩{Number(item.product.price).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="order-result-page__total">
                <span>총 결제 금액</span>
                <strong>₩{Number(order.totalAmount).toLocaleString()}</strong>
              </div>
            </div>

            <div className="order-result-page__actions">
              <Link
                to="/orders"
                className="order-result-page__btn order-result-page__btn--ghost"
              >
                주문목록보기
              </Link>
              <Link to="/" className="order-result-page__btn">
                쇼핑 계속하기
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default OrderSuccessPage;
