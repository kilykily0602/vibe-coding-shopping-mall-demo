import { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const Navbar = memo(function Navbar({
  user,
  loading,
  onLogout,
  cartCount: cartCountProp,
}) {
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isAdmin = user?.user_type === "admin";
  const displayCount =
    typeof cartCountProp === "number" ? cartCountProp : cartCount;

  useEffect(() => {
    if (typeof cartCountProp === "number") return;

    const token = localStorage.getItem("token");

    if (!token || !user) {
      setCartCount(0);
      return;
    }

    let cancelled = false;

    const fetchCartCount = async () => {
      try {
        const res = await fetch("/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (!cancelled) setCartCount(0);
          return;
        }

        const data = await res.json();
        const items = data?.cart?.items || [];
        const total = items.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0
        );

        if (!cancelled) setCartCount(total);
      } catch {
        if (!cancelled) setCartCount(0);
      }
    };

    fetchCartCount();

    return () => {
      cancelled = true;
    };
  }, [user, cartCountProp]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [user]);

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout?.();
  };

  return (
    <nav
      style={{
        width: "100%",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid #eee",
        position: "fixed",
        top: 0,
        left: 0,
        background: "#fff",
        zIndex: 100,
        boxSizing: "border-box",
      }}
    >
      <Link
        to="/"
        style={{
          fontWeight: 700,
          fontSize: 22,
          color: "#111",
          textDecoration: "none",
        }}
      >
        MIZUHO
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginLeft: "auto",
        }}
      >
        <Link
          to="/cart"
          aria-label={`장바구니 ${displayCount}개`}
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            color: "#111",
            textDecoration: "none",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 8h12l-1 12H7L6 8z" />
            <path d="M9 8V7a3 3 0 0 1 6 0v1" />
          </svg>
          {displayCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -8,
                minWidth: 16,
                height: 16,
                padding: "0 4px",
                borderRadius: 999,
                background: "#e03131",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {displayCount}
            </span>
          )}
        </Link>

        {!loading &&
          (user?.name ? (
            <>
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#111",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {user.name}님 환영합니다
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      minWidth: 132,
                      padding: 6,
                      border: "1px solid #eee",
                      borderRadius: 8,
                      background: "#fff",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      zIndex: 110,
                    }}
                  >
                    <Link
                      to="/orders"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 12px",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111",
                        textDecoration: "none",
                      }}
                    >
                      내 주문 목록
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        padding: "10px 12px",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#111",
                        cursor: "pointer",
                      }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>

              {isAdmin && (
                <Link
                  to="/mypage"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 32,
                    padding: "6px 14px",
                    borderRadius: 4,
                    background: "#111",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  어드민
                </Link>
              )}
            </>
          ) : (
            <Link
              to="/login"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#111",
                textDecoration: "none",
              }}
            >
              로그인
            </Link>
          ))}
      </div>
    </nav>
  );
});

export default Navbar;
