import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const STEPS = [
  { id: 1, label: "배송정보" },
  { id: 2, label: "결제정보" },
  { id: 3, label: "주문완료" },
];

const PAYMENTS = [
  { id: "card", label: "신용카드" },
  { id: "bank", label: "계좌이체" },
  { id: "kakao", label: "카카오페이" },
  { id: "naver", label: "네이버페이" },
];

const STORE_ID = "store-576b0c4e-05d0-420b-997a-1c47cbf1c3fb";
const CHANNEL_KEY = "channel-key-cef1e5c6-0f97-471f-b0f1-fccc9301ae3c";
const CHECKOUT_DRAFT_KEY = "mizuho_checkout_draft";

function createPaymentId() {
  // 이니시스 oid 최대 40자 제한
  return `pay${Date.now()}${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildPaymentRequest({
  paymentId,
  paymentMethod,
  orderName,
  amount,
  user,
  form,
}) {
  const customer = {
    fullName: form.name.trim() || user?.name || "구매자",
    phoneNumber: digitsOnly(form.phone) || "01000000000",
  };

  if (user?.email) {
    customer.email = user.email;
  }

  const request = {
    storeId: STORE_ID,
    channelKey: CHANNEL_KEY,
    paymentId,
    orderName,
    totalAmount: amount,
    currency: "CURRENCY_KRW",
    customer,
    redirectUrl: `${window.location.origin}/checkout`,
  };

  if (paymentMethod === "bank") {
    request.payMethod = "TRANSFER";
  } else if (paymentMethod === "kakao") {
    request.payMethod = "EASY_PAY";
    request.easyPay = { easyPayProvider: "KAKAOPAY" };
  } else if (paymentMethod === "naver") {
    request.payMethod = "EASY_PAY";
    request.easyPay = { easyPayProvider: "NAVERPAY" };
  } else {
    request.payMethod = "CARD";
  }

  return request;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function createOrder(shippingForm, method, paymentId = "") {
  const fullAddress = [shippingForm.address.trim(), shippingForm.addressDetail.trim()]
    .filter(Boolean)
    .join(" ");

  const shipping = {
    name: shippingForm.name.trim(),
    phone: shippingForm.phone.trim(),
    address: shippingForm.zip.trim()
      ? `[${shippingForm.zip.trim()}] ${fullAddress}`
      : fullAddress,
  };

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      shipping,
      paymentMethod: method,
      paymentId,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "주문에 실패했습니다.");
  }

  return data.order;
}

async function confirmPayment({
  paymentId,
  shippingForm,
  paymentMethod,
  clientSaidFailed = false,
}) {
  const fullAddress = [shippingForm.address.trim(), shippingForm.addressDetail.trim()]
    .filter(Boolean)
    .join(" ");

  const shipping = {
    name: shippingForm.name.trim(),
    phone: shippingForm.phone.trim(),
    address: shippingForm.zip.trim()
      ? `[${shippingForm.zip.trim()}] ${fullAddress}`
      : fullAddress,
  };

  const res = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      paymentId,
      shipping,
      paymentMethod,
      clientSaidFailed,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || "결제 확인에 실패했습니다.");
    err.paymentStatus = data.paymentStatus;
    throw err;
  }

  return data;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    addressDetail: "",
    zip: "",
    memo: "",
  });

  useEffect(() => {
    if (!window.PortOne) {
      console.warn("포트원 V2 스크립트가 로드되지 않았습니다.");
    }
  }, []);

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
        if (!cancelled) {
          setUser(me);
          setForm((prev) => ({
            ...prev,
            name: me.name || "",
            phone: me.phone || "",
            address: me.address || "",
          }));
        }

        const cartRes = await fetch("/api/cart", {
          headers: getAuthHeaders(),
        });
        const cartData = await cartRes.json();

        if (!cartRes.ok) {
          throw new Error(cartData.message || "장바구니를 불러오지 못했습니다.");
        }

        if (!cancelled) {
          // 결제 리다이렉트 복귀 시에는 장바구니가 비어 있어도 checkout에 머물러 처리
          if (!cartData.cart?.items?.length) {
            const returningPaymentId = new URLSearchParams(
              window.location.search
            ).get("paymentId");
            if (!returningPaymentId) {
              navigate("/cart", { replace: true });
              return;
            }
          } else {
            setCart(cartData.cart);
          }
        }

        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get("paymentId");
        const payCode = params.get("code");
        const payMessage = params.get("message");

        if (paymentId && !cancelled) {
          window.history.replaceState({}, "", "/checkout");
          setStep(2);

          const draft = JSON.parse(
            sessionStorage.getItem(CHECKOUT_DRAFT_KEY) || "null"
          );
          if (draft?.form) {
            setForm(draft.form);
            setPaymentMethod(draft.paymentMethod || "card");
          }

          const shippingForm = draft?.form || {
            name: me.name || "",
            phone: me.phone || "",
            address: me.address || "",
            addressDetail: "",
            zip: "",
            memo: "",
          };
          const method = draft?.paymentMethod || "card";

          setOrdering(true);
          try {
            const result = await confirmPayment({
              paymentId,
              shippingForm,
              paymentMethod: method,
              clientSaidFailed: Boolean(payCode),
            });
            sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
            if (!cancelled) {
              setStep(3);
              navigate(`/orders/complete/${result.order._id}`, { replace: true });
            }
          } catch (orderErr) {
            sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
            if (!cancelled) {
              navigate("/orders/fail", {
                replace: true,
                state: {
                  message:
                    payMessage ||
                    orderErr.message ||
                    "결제가 취소되었거나 실패했습니다.",
                },
              });
            }
          } finally {
            if (!cancelled) setOrdering(false);
          }
        }
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

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateShipping = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("받는 분, 연락처, 주소는 필수입니다.");
      return false;
    }
    setError("");
    return true;
  };

  const goNext = () => {
    if (!validateShipping()) return;
    setStep(2);
  };

  const handleOrder = async () => {
    if (!validateShipping()) {
      setStep(1);
      return;
    }

    const PortOne = window.PortOne;
    if (!PortOne) {
      setError("결제 모듈을 불러오지 못했습니다. 페이지를 새로고침해 주세요.");
      return;
    }

    setOrdering(true);
    setError("");

    const firstName = items[0]?.product?.name || "MIZUHO 상품";
    const extraCount = items.length - 1;
    const orderName =
      extraCount > 0 ? `${firstName} 외 ${extraCount}건` : firstName;

    const paymentId = createPaymentId();
    sessionStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      JSON.stringify({ form, paymentMethod, paymentId })
    );

    try {
      const response = await PortOne.requestPayment(
        buildPaymentRequest({
          paymentId,
          paymentMethod,
          orderName,
          amount: summary.total,
          user,
          form,
        })
      );

      const clientSaidFailed = response?.code != null;

      try {
        const result = await confirmPayment({
          paymentId,
          shippingForm: form,
          paymentMethod,
          clientSaidFailed,
        });
        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
        setStep(3);
        navigate(`/orders/complete/${result.order._id}`, { replace: true });
      } catch (confirmErr) {
        if (clientSaidFailed) {
          sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          navigate("/orders/fail", {
            replace: true,
            state: {
              message:
                response.message || "결제가 취소되었거나 실패했습니다.",
            },
          });
          return;
        }

        try {
          const order = await createOrder(form, paymentMethod, paymentId);
          sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          setStep(3);
          navigate(`/orders/complete/${order._id}`, { replace: true });
        } catch (orderErr) {
          sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          navigate("/orders/fail", {
            replace: true,
            state: {
              message:
                confirmErr.message ||
                orderErr.message ||
                "결제는 완료되었지만 주문 저장에 실패했습니다.",
            },
          });
        }
      }
    } catch (err) {
      try {
        const result = await confirmPayment({
          paymentId,
          shippingForm: form,
          paymentMethod,
          clientSaidFailed: true,
        });
        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
        setStep(3);
        navigate(`/orders/complete/${result.order._id}`, { replace: true });
      } catch {
        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
        navigate("/orders/fail", {
          replace: true,
          state: {
            message: err.message || "결제에 실패했습니다.",
          },
        });
      }
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="mall checkout-page">
      <Navbar user={user} loading={authLoading} onLogout={handleLogout} />

      <main className="checkout-page__main">
        <nav className="checkout-page__steps" aria-label="주문 단계">
          {STEPS.map((item, index) => {
            const active = step === item.id;
            const done = step > item.id;

            return (
              <div key={item.id} className="checkout-page__step-wrap">
                {index > 0 && (
                  <span
                    className={
                      done || active
                        ? "checkout-page__step-line is-on"
                        : "checkout-page__step-line"
                    }
                  />
                )}
                <div
                  className={
                    active || done
                      ? "checkout-page__step is-on"
                      : "checkout-page__step"
                  }
                >
                  <span>{item.id}</span>
                  <p>{item.label}</p>
                </div>
              </div>
            );
          })}
        </nav>

        {loading && <p className="checkout-page__status">불러오는 중...</p>}
        {error && <p className="checkout-page__error">{error}</p>}

        {!loading && items.length > 0 && (
          <div className="checkout-page__layout">
            <div className="checkout-page__content">
              {step === 1 && (
                <section className="checkout-page__card">
                  <h2 className="checkout-page__card-title">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M3 7h13v10H3z" />
                      <path d="M16 10h4l1 3v4h-5z" />
                      <circle cx="7.5" cy="18.5" r="1.5" />
                      <circle cx="18.5" cy="18.5" r="1.5" />
                    </svg>
                    배송 정보
                  </h2>

                  <div className="checkout-page__form">
                    <label>
                      받는 분 <em>*</em>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="어드민"
                      />
                    </label>
                    <label>
                      연락처 <em>*</em>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="010-1234-5678"
                      />
                    </label>
                    <label className="checkout-page__full">
                      주소 <em>*</em>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => updateField("address", e.target.value)}
                        placeholder="기본 주소"
                      />
                      <input
                        type="text"
                        value={form.addressDetail}
                        onChange={(e) =>
                          updateField("addressDetail", e.target.value)
                        }
                        placeholder="상세 주소"
                        style={{ marginTop: 8 }}
                      />
                    </label>
                    <label>
                      우편번호
                      <input
                        type="text"
                        value={form.zip}
                        onChange={(e) => updateField("zip", e.target.value)}
                        placeholder="12345"
                      />
                    </label>
                    <label>
                      배송 요청사항
                      <input
                        type="text"
                        value={form.memo}
                        onChange={(e) => updateField("memo", e.target.value)}
                        placeholder="배송 시 요청사항 (선택)"
                      />
                    </label>
                  </div>
                </section>
              )}

              {step === 2 && (
                <>
                  <section className="checkout-page__card">
                    <h2 className="checkout-page__card-title">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <path d="M3 8h13v9H3z" />
                        <path d="M16 11h4l1 3v3h-5z" />
                        <circle cx="7" cy="18.5" r="1.5" />
                        <circle cx="18" cy="18.5" r="1.5" />
                      </svg>
                      배송 방법
                    </h2>
                    <div className="checkout-page__ship-method">
                      <div>
                        <strong>일반 배송</strong>
                        <p>3-5 영업일</p>
                      </div>
                      <span className="checkout-page__free">무료</span>
                    </div>
                  </section>

                  <section className="checkout-page__card">
                    <h2 className="checkout-page__card-title">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                      >
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path d="M2 10h20" />
                      </svg>
                      결제 정보
                    </h2>
                    <div className="checkout-page__payments" role="radiogroup">
                      {PAYMENTS.map((item) => (
                        <label
                          key={item.id}
                          className={
                            paymentMethod === item.id
                              ? "checkout-page__pay-option is-active"
                              : "checkout-page__pay-option"
                          }
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={item.id}
                            checked={paymentMethod === item.id}
                            onChange={() => setPaymentMethod(item.id)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>

            <aside className="checkout-page__summary">
              <h2>주문 요약</h2>

              <ul className="checkout-page__products">
                {items.map((item) => {
                  const productId = item.product?._id || item.product;
                  const price = Number(item.product?.price || 0);

                  return (
                    <li key={productId}>
                      {item.product?.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                        />
                      ) : (
                        <div className="checkout-page__thumb-empty" />
                      )}
                      <div>
                        <strong>{item.product?.name || "상품"}</strong>
                        <p>{item.quantity}개</p>
                      </div>
                      <span>₩{price.toLocaleString()}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="checkout-page__row">
                <span>상품 수량 ({summary.quantity}개)</span>
                <strong>₩{summary.total.toLocaleString()}</strong>
              </div>
              <div className="checkout-page__row">
                <span>배송비</span>
                <strong className="checkout-page__free">무료</strong>
              </div>
              <div className="checkout-page__total">
                <span>총 결제금액</span>
                <strong>₩{summary.total.toLocaleString()}</strong>
              </div>

              {step === 1 ? (
                <button
                  type="button"
                  className="checkout-page__cta"
                  onClick={goNext}
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  className="checkout-page__cta"
                  onClick={handleOrder}
                  disabled={ordering}
                >
                  {ordering ? "주문 중..." : "주문하기"}
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  className="checkout-page__back-btn"
                  onClick={() => setStep(1)}
                >
                  배송정보로 돌아가기
                </button>
              )}

              <p className="checkout-page__note">
                주문하기를 누르면 결제창이 열립니다. 카드 인증 창이 안 보이면
                주소창 오른쪽 팝업 차단을 해제해 주세요. 승인 여부는 서버에서
                한 번 더 확인합니다.
              </p>
              <Link to="/cart" className="checkout-page__cart-link">
                장바구니로 돌아가기
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default CheckoutPage;
