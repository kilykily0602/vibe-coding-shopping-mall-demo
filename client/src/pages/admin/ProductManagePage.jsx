import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";

const CATEGORIES = ["전체", "상의", "하의", "악세사리"];
const PAGE_LIMIT = 20;

const INITIAL_PAGINATION = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m4 20 4.2-1.1L19 8.1a1.8 1.8 0 0 0 0-2.5l-.6-.6a1.8 1.8 0 0 0-2.5 0L5.1 15.8 4 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M9 7V5h6v2M8 7l.7 12h6.6L16 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductManagePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [filterOpen, setFilterOpen] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  // GET /api/products?page=&limit=2&search=&category=
  const fetchProducts = useCallback(async (pageNumber = 1) => {
    setProductsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: String(PAGE_LIMIT),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (category && category !== "전체") {
        params.set("category", category);
      }

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "상품 목록을 불러오지 못했습니다.");
      }

      const nextProducts = Array.isArray(data.products) ? data.products : [];
      const nextPagination = data.pagination || INITIAL_PAGINATION;

      // 현재 페이지에 상품이 없고 이전 페이지가 있으면 한 페이지 당김
      if (nextProducts.length === 0 && pageNumber > 1 && nextPagination.hasPrev) {
        setPage(pageNumber - 1);
        return;
      }

      setProducts(nextProducts);
      setPagination(nextPagination);
      setPage(nextPagination.page || pageNumber);
    } catch (err) {
      setProducts([]);
      setPagination(INITIAL_PAGINATION);
      setError(err.message || "상품 목록을 불러오지 못했습니다.");
    } finally {
      setProductsLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    const checkAdmin = async () => {
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

        const me = await res.json();

        if (me.user_type !== "admin") {
          if (!cancelled) navigate("/", { replace: true });
          return;
        }

        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) navigate("/login", { replace: true });
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    fetchProducts(page);
  }, [user, page, fetchProducts]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    setFilterOpen(false);
    setPage(1);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/", { replace: true });
  };

  // DELETE /api/products/:id
  const handleDelete = async (product) => {
    const ok = window.confirm(`"${product.name}" 상품을 삭제할까요?`);
    if (!ok) return;

    setDeletingId(product._id);
    setError("");

    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "상품 삭제에 실패했습니다.");
      }

      await fetchProducts(page);
    } catch (err) {
      setError(err.message || "상품 삭제에 실패했습니다.");
    } finally {
      setDeletingId("");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="mall">
        <Navbar user={null} loading onLogout={handleLogout} />
        <main className="pm">
          <p className="pm__loading">불러오는 중...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="mall">
      <Navbar user={user} loading={false} onLogout={handleLogout} />

      <main className="pm">
        <div className="pm__header">
          <div>
            <Link to="/mypage" className="pm__back">
              ← 대시보드
            </Link>
            <h1>상품 관리</h1>
          </div>
          <Link to="/admin/products/new" className="pm__create">
            새 상품 등록
          </Link>
        </div>

        <section className="pm__toolbar">
          <label className="pm__search">
            <IconSearch />
            <input
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="상품명으로 검색..."
            />
          </label>

          <div className="pm__filter-wrap">
            <button
              type="button"
              className="pm__filter"
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-expanded={filterOpen}
            >
              <IconFilter />
              필터
            </button>

            {filterOpen && (
              <div className="pm__filter-menu">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      category === item
                        ? "pm__filter-option is-active"
                        : "pm__filter-option"
                    }
                    onClick={() => handleCategoryChange(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {error && <p className="form-error">{error}</p>}

        <section className="pm__table-wrap">
          {productsLoading ? (
            <p className="pm__loading">상품 정보를 불러오는 중...</p>
          ) : (
            <table className="pm__table">
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="pm__empty">
                      표시할 상품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <img
                          className="pm__thumb"
                          src={product.image}
                          alt={product.name}
                        />
                      </td>
                      <td>
                        <strong className="pm__name">{product.name}</strong>
                        <span className="pm__sku">{product.sku}</span>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <strong className="pm__price">
                          {Number(product.price).toLocaleString()}원
                        </strong>
                      </td>
                      <td>
                        <div className="pm__actions">
                          <button
                            type="button"
                            className="pm__action pm__action--edit"
                            aria-label={`${product.name} 수정`}
                            title="수정 기능은 준비 중입니다"
                            onClick={() =>
                              setError("상품 수정 기능은 곧 추가됩니다.")
                            }
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="pm__action pm__action--delete"
                            aria-label={`${product.name} 삭제`}
                            disabled={deletingId === product._id}
                            onClick={() => handleDelete(product)}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>

        <div className="pm__pagination">
          <button
            type="button"
            className="pm__page-btn"
            disabled={!pagination.hasPrev || productsLoading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            이전
          </button>
          <span className="pm__page-info">
            {pagination.page} / {pagination.totalPages}
            <em>총 {pagination.total}개</em>
          </span>
          <button
            type="button"
            className="pm__page-btn"
            disabled={!pagination.hasNext || productsLoading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            다음
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProductManagePage;
