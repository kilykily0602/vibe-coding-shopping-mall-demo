import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

function OrderFailurePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const failMessage =
    location.state?.message ||
    new URLSearchParams(location.search).get("message") ||
    "결제가 취소되었거나 주문에 실패했습니다.";

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
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    load();
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

  return (
    <div className="mall order-result-page">
      <Navbar user={user} loading={authLoading} onLogout={handleLogout} />

      <main className="order-result-page__main">
        <p className="order-result-page__eyebrow">Order Failed</p>

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
          <h1>주문에 실패했습니다</h1>
          <p className="order-result-page__sub">{failMessage}</p>

          <div className="order-result-page__panel">
            <h2>안내</h2>
            <p className="order-result-page__hint">
              결제가 승인되었는데도 이 화면이 보인다면, 잠시 후 주문 내역에서
              확인해 주세요. 문제가 계속되면 고객센터로 문의해 주세요.
            </p>
          </div>

          <div className="order-result-page__actions">
            <Link to="/checkout" className="order-result-page__btn">
              다시 결제하기
            </Link>
            <Link
              to="/orders"
              className="order-result-page__btn order-result-page__btn--ghost"
            >
              주문목록보기
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default OrderFailurePage;
