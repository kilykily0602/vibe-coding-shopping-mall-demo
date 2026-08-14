import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";

const STATUS_LABEL = {
  주문확인: "처리중",
  상품준비중: "처리중",
  배송시작: "배송중",
  배송중: "배송중",
  배송완료: "배송완료",
  주문취소: "주문취소",
};

function OrderPage() {
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

    if (!id) {
      navigate("/orders", { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

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
          throw new Error(data.message || "주문을 불러오지 못했습니다.");
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
    <div className="mall order-page">
      <Navbar user={user} loading={authLoading} onLogout={handleLogout} />

      <main className="order-page__main">
        <header className="order-page__header">
          <button
            type="button"
            className="order-page__back"
            onClick={() => navigate("/orders")}
            aria-label="주문 목록으로"
          >
            ←
          </button>
          <h1>주문 상세</h1>
          <span className="order-page__back-spacer" aria-hidden="true" />
        </header>

        {loading && <p className="order-page__status">불러오는 중...</p>}
        {error && <p className="order-page__error">{error}</p>}

        {!loading && !error && order && (
          <section className="order-page__panel">
            <div className="order-page__done">
              <p className="order-page__badge">ORDER DETAIL</p>
              <h2>주문 상세</h2>
              <p>
                주문번호 <strong>{order.orderNo}</strong>
              </p>
            </div>

            <div className="order-page__meta">
              <div>
                <span>상태</span>
                <strong>
                  {STATUS_LABEL[order.orderStatus || order.status] ||
                    order.orderStatus ||
                    order.status}
                </strong>
              </div>
              <div>
                <span>결제금액</span>
                <strong>₩{Number(order.totalAmount).toLocaleString()}</strong>
              </div>
              <div>
                <span>수량</span>
                <strong>{order.itemCount}개</strong>
              </div>
            </div>

            <h3>배송 정보</h3>
            <ul className="order-page__shipping">
              <li>수령인: {order.shipping?.name}</li>
              <li>연락처: {order.shipping?.phone}</li>
              <li>주소: {order.shipping?.address}</li>
            </ul>

            <h3>주문 상품</h3>
            <ul className="order-page__items">
              {(order.items || []).map((item) => (
                <li key={item.product?._id || item.product}>
                  {item.product?.image && (
                    <img src={item.product.image} alt={item.product.name} />
                  )}
                  <div>
                    <strong>{item.product?.name || "상품"}</strong>
                    <p>
                      수량: {item.quantity}
                      {item.product?.price != null &&
                        ` · ₩${Number(item.product.price).toLocaleString()}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="order-page__actions">
              <Link to="/orders" className="order-page__btn order-page__btn--ghost">
                주문목록보기
              </Link>
              <Link to="/" className="order-page__btn">
                쇼핑 계속하기
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default OrderPage;
