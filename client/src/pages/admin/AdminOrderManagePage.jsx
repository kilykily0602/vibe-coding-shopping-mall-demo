import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar";

const TABS = [
  { id: "all", label: "전체" },
  { id: "주문확인", label: "주문확인" },
  { id: "상품준비중", label: "상품준비중" },
  { id: "배송시작", label: "배송시작" },
  { id: "배송중", label: "배송중" },
  { id: "배송완료", label: "배송완료" },
  { id: "주문취소", label: "주문취소" },
];

const STATUS_META = {
  주문확인: { label: "주문확인", short: "확인", tone: "confirm" },
  상품준비중: { label: "상품준비중", short: "준비중", tone: "preparing" },
  배송시작: { label: "배송시작", short: "시작", tone: "start" },
  배송중: { label: "배송중", short: "배송중", tone: "shipping" },
  배송완료: { label: "배송완료", short: "완료", tone: "done" },
  주문취소: { label: "주문취소", short: "취소", tone: "cancelled" },
};

function getStatus(order) {
  return order?.orderStatus || order?.status || "주문확인";
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function productNames(order) {
  const names = (order.items || [])
    .map((line) => line.product?.name)
    .filter(Boolean);
  if (names.length === 0) return "상품 정보 없음";
  if (names.length === 1) return names[0];
  return `${names[0]} 외 ${names.length - 1}건`;
}

function AdminOrderManagePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

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
        if (me.user_type !== "admin") {
          navigate("/", { replace: true });
          return;
        }

        if (!cancelled) setUser(me);

        const res = await fetch("/api/orders", {
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
        (order) => getStatus(order) === item.id
      ).length;
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();

    return orders.filter((order) => {
      const status = getStatus(order);
      if (tab !== "all" && status !== tab) return false;
      if (!q) return true;

      const orderNo = String(order.orderNo || "").toLowerCase();
      const customerName = String(
        order.user?.name || order.shipping?.name || ""
      ).toLowerCase();
      const email = String(order.user?.email || "").toLowerCase();

      return (
        orderNo.includes(q) || customerName.includes(q) || email.includes(q)
      );
    });
  }, [orders, query, tab]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  };

  const updateStatus = async (orderId, orderStatus) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setBusyId(orderId);
    setMessage("");

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "상태 변경에 실패했습니다.");
      }

      setOrders((prev) =>
        prev.map((item) => (item._id === orderId ? data.order : item))
      );
      setMessage(`주문 상태가 "${orderStatus}"(으)로 변경되었습니다.`);
    } catch (err) {
      setMessage(err.message || "상태 변경에 실패했습니다.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mall">
      <Navbar user={user} loading={authLoading} onLogout={handleLogout} />

      <main className="admin-orders-page">
        <header className="admin-orders-page__header">
          <button
            type="button"
            className="admin-orders-page__back"
            onClick={() => navigate("/mypage")}
            aria-label="대시보드로"
          >
            ←
          </button>
          <h1>주문 관리</h1>
        </header>

        <div className="admin-orders-page__searchbar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="#9ca3af" strokeWidth="1.8" />
            <path
              d="M16.5 16.5 21 21"
              stroke="#9ca3af"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="주문번호 또는 고객명으로 검색..."
          />
          <button type="button" className="admin-orders-page__filter-in">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            필터
          </button>
        </div>

        <div className="admin-orders-page__tabs" role="tablist">
          {TABS.map((item) => {
            const count = tabCounts[item.id] || 0;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  active
                    ? "admin-orders-page__tab is-active"
                    : "admin-orders-page__tab"
                }
                onClick={() => setTab(item.id)}
              >
                <span>{item.label}</span>
                {(item.id === "all" || count > 0) && (
                  <em className="admin-orders-page__tab-count">{count}</em>
                )}
              </button>
            );
          })}
        </div>

        {loading && <p className="admin-orders-page__status">불러오는 중...</p>}
        {error && <p className="admin-orders-page__error">{error}</p>}
        {message && <p className="admin-orders-page__message">{message}</p>}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="admin-orders-page__empty">주문 목록이 없습니다.</div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <ul className="admin-orders-page__list">
            {filteredOrders.map((order) => {
              const status = getStatus(order);
              const meta = STATUS_META[status] || STATUS_META["주문확인"];
              const customerName =
                order.user?.name || order.shipping?.name || "고객";
              const email = order.user?.email || "-";
              const canPrepare =
                status === "주문확인" || status === "상품준비중";
              const canShip = status === "배송시작" || status === "배송중";

              return (
                <li key={order._id} className="admin-order-card">
                  <div className="admin-order-card__top">
                    <div>
                      <p className="admin-order-card__id">{order.orderNo}</p>
                      <p className="admin-order-card__sub">
                        {customerName} · {email}
                      </p>
                      <p className="admin-order-card__date">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`admin-order-card__badge admin-order-card__badge--${meta.tone}`}
                    >
                      {meta.short}
                    </span>
                  </div>

                  <div className="admin-order-card__body">
                    <div className="admin-order-card__cols">
                      <div>
                        <h3>주문 상품</h3>
                        <p>{productNames(order)}</p>
                      </div>
                      <div>
                        <h3>배송 주소</h3>
                        <p>{order.shipping?.name || customerName}</p>
                        <p>{order.shipping?.address || "-"}</p>
                      </div>
                    </div>

                    {(canPrepare || canShip) && (
                      <div className="admin-order-card__actions">
                        {canPrepare && (
                          <>
                            <button
                              type="button"
                              className="admin-order-card__btn admin-order-card__btn--primary"
                              disabled={busyId === order._id}
                              onClick={() =>
                                updateStatus(
                                  order._id,
                                  status === "주문확인"
                                    ? "상품준비중"
                                    : "배송시작"
                                )
                              }
                            >
                              {status === "주문확인"
                                ? "상품 준비중"
                                : "배송 시작"}
                            </button>
                            <button
                              type="button"
                              className="admin-order-card__btn"
                              disabled={busyId === order._id}
                              onClick={() =>
                                updateStatus(order._id, "주문취소")
                              }
                            >
                              주문 취소
                            </button>
                          </>
                        )}
                        {canShip && (
                          <button
                            type="button"
                            className="admin-order-card__btn admin-order-card__btn--primary"
                            disabled={busyId === order._id}
                            onClick={() =>
                              updateStatus(
                                order._id,
                                status === "배송시작" ? "배송중" : "배송완료"
                              )
                            }
                          >
                            {status === "배송시작" ? "배송중으로" : "배송 완료"}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="admin-order-card__foot">
                      <strong>
                        ₩{Number(order.totalAmount).toLocaleString()}
                      </strong>
                      <button
                        type="button"
                        className="admin-order-card__detail"
                        onClick={() => navigate(`/orders/${order._id}`)}
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
                        상세보기
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default AdminOrderManagePage;
