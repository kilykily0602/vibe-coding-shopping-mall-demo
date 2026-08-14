import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";

const CATEGORIES = ["상의", "하의", "악세사리"];

// 환경변수: client/.env
// VITE_CLOUDINARY_CLOUD_NAME=본인_클라우드네임
// VITE_CLOUDINARY_UPLOAD_PRESET=본인_업로드프리셋(Unsigned)
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const INITIAL_FORM = {
  sku: "",
  name: "",
  price: "0",
  category: "",
  image: "",
  description: "",
};

function ProductCreatePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Cloudinary 위젯 열기 → 성공 시 image URL 저장 + 미리보기
  const openCloudinaryWidget = () => {
    setError("");

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setError(
        "Cloudinary 환경변수가 없습니다. client/.env에 VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET을 넣고 Vite를 재시작해 주세요."
      );
      return;
    }

    if (!window.cloudinary) {
      setError("Cloudinary 위젯을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        // 로컬 파일 / URL / 카메라 업로드 지원
        sources: ["local", "url", "camera"],
        multiple: false,
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
        maxFileSize: 5_000_000,
      },
      (uploadError, result) => {
        if (!uploadError && result?.event === "success") {
          // 업로드 성공 → image 필드에 URL 저장 (미리보기용)
          setForm((prev) => ({
            ...prev,
            image: result.info.secure_url,
          }));
          setError("");
        }
      }
    );

    widget.open();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.sku.trim() || !form.name.trim() || !form.category || !form.image) {
      setError("SKU, 상품명, 카테고리, 대표 이미지는 필수입니다.");
      return;
    }

    const price = Number(form.price);

    if (Number.isNaN(price) || price < 0) {
      setError("판매가격을 올바르게 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sku: form.sku.trim(),
          name: form.name.trim(),
          price,
          category: form.category,
          image: form.image,
          description: form.description.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "상품 등록에 실패했습니다.");
        return;
      }

      setSuccess("상품이 등록되었습니다.");
      setForm(INITIAL_FORM);
      navigate("/admin/products");
    } catch {
      setError("상품 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="mall">
        <Navbar user={null} loading onLogout={handleLogout} />
        <main className="product-admin">
          <p className="product-admin__loading">불러오는 중...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="mall">
      <Navbar user={user} loading={false} onLogout={handleLogout} />

      <main className="product-admin">
        <div className="product-admin__toolbar">
          <Link to="/mypage" className="product-admin__back">
            <span aria-hidden>←</span>
            상품 관리
          </Link>
          <Link to="/admin/products/new" className="product-admin__new">
            + 새 상품 등록
          </Link>
        </div>

        <div className="product-admin__tabs" role="tablist">
          <NavLink
            to="/admin/products"
            end
            className={({ isActive }) =>
              `product-admin__tab${isActive ? " is-active" : ""}`
            }
          >
            상품 목록
          </NavLink>
          <NavLink
            to="/admin/products/new"
            className={({ isActive }) =>
              `product-admin__tab${isActive ? " is-active" : ""}`
            }
          >
            상품 등록
          </NavLink>
        </div>

        <section className="product-form-panel">
          <h1>새 상품 등록</h1>

          <form className="product-form" onSubmit={handleSubmit}>
            <div className="product-form__grid">
              <div className="product-form__col">
                <label className="product-field">
                  <span>SKU</span>
                  <input
                    type="text"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="SKU를 입력하세요"
                    required
                  />
                </label>

                <label className="product-field">
                  <span>상품명</span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="상품명을 입력하세요"
                    required
                  />
                </label>

                <label className="product-field">
                  <span>판매가격</span>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />
                </label>

                <label className="product-field">
                  <span>카테고리</span>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">카테고리 선택</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="product-form__col">
                {/* 3. URL 입력 대신 Cloudinary 업로드 버튼 + 미리보기 */}
                <div className="product-field">
                  <span>대표 이미지</span>
                  <div className="product-cloudinary">
                    <button
                      type="button"
                      className="product-cloudinary__button"
                      onClick={openCloudinaryWidget}
                    >
                      Cloudinary로 이미지 업로드
                    </button>
                    <p className="product-cloudinary__hint">
                      {form.image
                        ? "이미지가 업로드되었습니다. 아래에서 미리보기를 확인하세요."
                        : "Browse로 파일을 올리거나, Web Address로 이미지 URL을 입력할 수 있습니다."}
                    </p>
                  </div>
                  {form.image && (
                    <div className="product-field__preview-wrap">
                      <img
                        className="product-field__preview"
                        src={form.image}
                        alt="선택한 상품 미리보기"
                      />
                      <p className="product-field__preview-label">미리보기</p>
                    </div>
                  )}
                </div>

                <label className="product-field">
                  <span>상품 설명</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="상품에 대한 자세한 설명을 입력하세요"
                    rows={8}
                  />
                </label>
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}
            {success && <p className="product-form__success">{success}</p>}

            <div className="product-form__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => navigate("/mypage")}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={submitting}
              >
                {submitting ? "등록 중..." : "상품 등록"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default ProductCreatePage;
