import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const TABS = [
  { id: "all", label: "전체" },
  { id: "주문확인", label: "주문확인" },
  { id: "상품준비중", label: "상품준비중" },
  { id: "배송시작", label: "배송시작" },
  { id: "배송중", label: "배송중" },
  { id: "배송완료", label: "배송완료" },
  { id: "주문취소", label: "주문취소" },
];

const STATUS_TONE = {
  주문확인: "confirm",
  상품준비중: "preparing",
  배송시작: "start",
  배송중: "shipping",
  배송완료: "done",
  주문취소: "cancelled",
};

function getOrderStatus(order) {
  return order?.orderStatus || order?.status || "주문확인";
}

function formatOrderDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function estimateArrival(createdAt) {
  const start = new Date(createdAt || Date.now());
  const end = new Date(start);
  start.setDate(start.getDate() + 3);
  end.setDate(end.getDate() + 5);
  const month = start.toLocaleDateString("en-US", { month: "long" });
  return `${month} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
}

function productOptionText(product) {
  if (!product) return "";
  if (product.category) return `카테고리: ${product.category}`;
  return "";
}

function lineAmount(line) {
  const price = Number(line.product?.price);
  const qty = Number(line.quantity) || 0;
  if (!Number.isFinite(price)) return null;
  return price * qty;
}

function OrderListPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackNotice, setTrackNotice] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
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

        const res = await fetch("/api/orders/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "주문 목록을 불러오지 못했습니다.");
        }

        if (!cancelled) setOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "주문 목록을 불러오지 못했습니다.");
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

  const tabCounts = useMemo(() => {
    const counts = { all: orders.length };
    for (const item of TABS) {
      if (item.id === "all") continue;
      counts[item.id] = orders.filter(
        (order) => getOrderStatus(order) === item.id
      ).length;
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (tab === "all") return orders;
    return orders.filter((item) => getOrderStatus(item) === tab);
  }, [orders, tab]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  };

  const handleTrack = (order) => {
    const status = getOrderStatus(order);
    setTrackNotice(
      `[${order.orderNo}] ${status}\n예상 도착일: ${estimateArrival(
        order.createdAt
      )}\n수령인: ${order.shipping?.name || "-"}\n주소: ${
        order.shipping?.address || "-"
      }`
    );
  };

  return (
    <div className="mall order-page">
      <Navbar user={user} loading={authLoading} onLogout={handleLogout} />

      <main className="order-page__main">
        <header className="order-page__header">
          <button
            type="button"
            className="order-page__back"
            onClick={() => navigate(-1)}
            aria-label="이전으로"
          >
            ←
          </button>
          <h1>주문 내역</h1>
          <span className="order-page__back-spacer" aria-hidden="true" />
        </header>

        {loading && <p className="order-page__status">불러오는 중...</p>}
        {error && <p className="order-page__error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="order-page__tabs" role="tablist" aria-label="주문 상태">
              {TABS.map((item) => {
                const count = tabCounts[item.id] || 0;
                const showCount = item.id === "all" || count > 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    className={
                      tab === item.id
                        ? "order-page__tab is-active"
                        : "order-page__tab"
                    }
                    onClick={() => setTab(item.id)}
                  >
                    <span>{item.label}</span>
                    {showCount && (
                      <em className="order-page__tab-count">{count}</em>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="order-page__empty">
                <p>주문 내역이 없습니다.</p>
                <Link to="/">쇼핑하러 가기</Link>
              </div>
            ) : (
              <ul className="order-page__cards">
                {filteredOrders.map((item) => {
                  const status = getOrderStatus(item);
                  const tone = STATUS_TONE[status] || "confirm";
                  return (
                    <li key={item._id} className="order-card">
                      <div className="order-card__head">
                        <div>
                          <p className="order-card__id">
                            주문 #{item.orderNo}
                          </p>
                          <p className="order-card__date">
                            주문일: {formatOrderDate(item.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`order-card__badge order-card__badge--${tone}`}
                        >
                          {status}
                        </span>
                      </div>

                      <ul className="order-card__items">
                        {(item.items || []).map((line) => {
                          const option = productOptionText(line.product);
                          const amount = lineAmount(line);
                          return (
                            <li key={line.product?._id || line.product}>
                              {line.product?.image ? (
                                <img
                                  src={line.product.image}
                                  alt={line.product?.name || "상품"}
                                />
                              ) : (
                                <div className="order-card__thumb" />
                              )}
                              <div className="order-card__item-info">
                                <strong>
                                  {line.product?.name || "상품"}
                                </strong>
                                {option && (
                                  <p className="order-card__option">{option}</p>
                                )}
                                <p>수량: {line.quantity}</p>
                              </div>
                              <span className="order-card__price">
                                {amount != null
                                  ? `₩${amount.toLocaleString()}`
                                  : line.product?.price != null
                                    ? `₩${Number(
                                        line.product.price
                                      ).toLocaleString()}`
                                    : ""}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="order-card__mid">
                        <p>
                          예상 도착일: {estimateArrival(item.createdAt)}
                        </p>
                        <div className="order-card__actions">
                          <Link
                            to={`/orders/${item._id}`}
                            className="order-card__detail-btn"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="3"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              />
                            </svg>
                            주문 상세보기
                          </Link>
                          <button
                            type="button"
                            className="order-card__track-btn"
                            onClick={() => handleTrack(item)}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M3 7h11v10H3V7Zm11 3h4l3 3v4h-7V10Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinejoin="round"
                              />
                              <circle
                                cx="7"
                                cy="18.5"
                                r="1.5"
                                fill="currentColor"
                              />
                              <circle
                                cx="17"
                                cy="18.5"
                                r="1.5"
                                fill="currentColor"
                              />
                            </svg>
                            배송 추적
                          </button>
                        </div>
                      </div>

                      <div className="order-card__total-row">
                        <span>세금 포함</span>
                        <strong>
                          ₩{Number(item.totalAmount).toLocaleString()}
                        </strong>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>

      {trackNotice && (
        <div
          className="order-track-modal"
          role="dialog"
          aria-modal="true"
          aria-label="배송 추적"
        >
          <div className="order-track-modal__panel">
            <h2>배송 추적</h2>
            <pre>{trackNotice}</pre>
            <button
              type="button"
              className="order-card__detail-btn"
              onClick={() => setTrackNotice("")}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderListPage;
