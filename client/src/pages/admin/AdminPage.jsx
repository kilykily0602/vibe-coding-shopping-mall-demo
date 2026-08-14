import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import {
  ADMIN_MENUS,
  ADMIN_STATS,
  RECENT_ORDERS,
} from "../../data/adminData";

function IconCart({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.5 5h1.7l1.2 10.2a1.5 1.5 0 0 0 1.5 1.3h8.8a1.5 1.5 0 0 0 1.5-1.2L19.5 8H7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="19.5" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="19.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconBox({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M4 8.5 12 13l8-4.5M12 13v7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5.5 19c1.3-3 3.5-4.5 6.5-4.5s5.2 1.5 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChart({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 18V6M4 18h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M7.5 14.5 11 11l3 2.5 4.5-5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMegaphone({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10v4a2 2 0 0 0 2 2h1l3 3V5L7 8H6a2 2 0 0 0-2 2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M14 8.5c1.3.8 2.2 2 2.2 3.5s-.9 2.7-2.2 3.5M17 6.5c2.2 1.4 3.5 3.4 3.5 5.5S19.2 16.1 17 17.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBars({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 18V11M12 18V6M19 18v-8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatIcon({ type }) {
  const map = {
    cart: IconCart,
    box: IconBox,
    user: IconUser,
    chart: IconChart,
  };
  const Icon = map[type] || IconChart;
  return <Icon className={`admin-stat__icon admin-stat__icon--${type}`} />;
}

function MenuIcon({ type }) {
  if (type === "box") {
    return <IconBox className="admin-menu__icon admin-menu__icon--box" />;
  }
  return <IconCart className="admin-menu__icon admin-menu__icon--cart" />;
}

function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
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
          if (!cancelled) navigate("/login", { replace: true });
          return;
        }

        const data = await res.json();

        if (data.user_type !== "admin") {
          if (!cancelled) navigate("/", { replace: true });
          return;
        }

        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) navigate("/login", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMe();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  };

  if (loading || !user) {
    return (
      <div className="mall">
        <Navbar user={null} loading onLogout={handleLogout} />
        <main className="admin-page">
          <p className="admin-page__loading">불러오는 중...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="mall">
      <Navbar user={user} loading={false} onLogout={handleLogout} />

      <main className="admin-page">
        <header className="admin-page__header">
          <h1>관리자 대시보드</h1>
          <p>MIZUHO 쇼핑몰 관리 시스템에 오신 것을 환영합니다.</p>
        </header>

        <section className="admin-stats" aria-label="요약 지표">
          {ADMIN_STATS.map((stat) => (
            <article
              key={stat.id}
              className={
                stat.id === "orders" || stat.id === "products"
                  ? "admin-stat admin-stat--clickable"
                  : "admin-stat"
              }
              role={
                stat.id === "orders" || stat.id === "products"
                  ? "button"
                  : undefined
              }
              tabIndex={
                stat.id === "orders" || stat.id === "products" ? 0 : undefined
              }
              onClick={() => {
                if (stat.id === "orders") navigate("/admin/orders");
                if (stat.id === "products") navigate("/admin/products");
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                if (stat.id === "orders") navigate("/admin/orders");
                if (stat.id === "products") navigate("/admin/products");
              }}
            >
              <div className="admin-stat__copy">
                <p className="admin-stat__label">{stat.label}</p>
                <p className="admin-stat__value">{stat.value}</p>
                <p className="admin-stat__trend">{stat.trend}</p>
              </div>
              <StatIcon type={stat.icon} />
            </article>
          ))}
        </section>

        <section className="admin-panel" aria-labelledby="admin-quick-title">
          <h2 id="admin-quick-title">빠른 작업</h2>
          <div className="admin-quick">
            <button
              type="button"
              className="admin-quick__primary"
              onClick={() => navigate("/admin/products/new")}
            >
              + 새 상품 등록
            </button>
            <button
              type="button"
              className="admin-quick__item"
              onClick={() => navigate("/admin/orders")}
            >
              <IconMegaphone className="admin-quick__svg" />
              주문 관리
            </button>
            <button type="button" className="admin-quick__item">
              <IconBars className="admin-quick__svg" />
              매출 분석
            </button>
          </div>
        </section>

        <section className="admin-panel" aria-labelledby="admin-orders-title">
          <div className="admin-panel__head">
            <h2 id="admin-orders-title">최근 주문</h2>
            <button
              type="button"
              className="admin-panel__link"
              onClick={() => navigate("/admin/orders")}
            >
              전체보기
            </button>
          </div>

          <ul className="admin-orders">
            {RECENT_ORDERS.map((order) => (
              <li key={order.id}>
                <button
                  type="button"
                  className="admin-order"
                  onClick={() => navigate("/admin/orders")}
                >
                  <div className="admin-order__meta">
                    <strong>{order.id}</strong>
                    <span>{order.customer}</span>
                    <time dateTime={order.date}>{order.date}</time>
                  </div>
                  <div className="admin-order__aside">
                    <span
                      className={`admin-order__status admin-order__status--${order.status}`}
                    >
                      {order.statusLabel}
                    </span>
                    <em>{order.price}</em>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-menus" aria-label="관리 메뉴">
          {ADMIN_MENUS.map((menu) => (
            <button
              key={menu.id}
              type="button"
              className="admin-menu"
              onClick={() => {
                if (menu.id === "products") {
                  navigate("/admin/products");
                }
                if (menu.id === "orders") {
                  navigate("/admin/orders");
                }
              }}
            >
              <MenuIcon type={menu.icon} />
              <strong>{menu.title}</strong>
              <span>{menu.description}</span>
            </button>
          ))}
        </section>

        <p className="admin-page__home">
          <Link to="/">쇼핑몰 홈으로</Link>
        </p>
      </main>
    </div>
  );
}

export default AdminPage;
