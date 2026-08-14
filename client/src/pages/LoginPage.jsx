import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField";
import { getErrorMessage } from "../utils/authForm";

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("member");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [saveEmail, setSaveEmail] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setForm((prev) => ({ ...prev, email: savedEmail }));
      setSaveEmail(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("서버 응답을 처리할 수 없습니다.");
      }

      if (!res.ok) {
        throw new Error(data.message || "로그인에 실패했습니다.");
      }

      if (!data.token) {
        throw new Error("로그인 토큰을 받지 못했습니다.");
      }

      if (saveEmail) {
        localStorage.setItem("savedEmail", form.email.trim());
      } else {
        localStorage.removeItem("savedEmail");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "로그인에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login">
      <div className="login__inner">
        <h1 className="login__title">로그인</h1>

        <div className="login__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={`login__tab ${tab === "member" ? "is-active" : ""}`}
            onClick={() => setTab("member")}
          >
            회원
          </button>
          <button
            type="button"
            role="tab"
            className={`login__tab ${tab === "guest" ? "is-active" : ""}`}
            onClick={() => setTab("guest")}
          >
            비회원 (주문조회)
          </button>
        </div>

        {tab === "member" ? (
          <form className="login__form" onSubmit={handleSubmit}>
            <div className="login__row">
              <div className="login__fields">
                <input
                  type="email"
                  name="email"
                  placeholder="이메일"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <PasswordField
                  name="password"
                  placeholder="비밀번호"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="login__submit"
                disabled={loading}
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </div>

            <label className="login__save">
              <input
                type="checkbox"
                checked={saveEmail}
                onChange={(e) => setSaveEmail(e.target.checked)}
              />
              <span>이메일 저장</span>
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="login__links">
              <button type="button" className="login__link-btn">
                비밀번호 찾기
              </button>
              <Link to="/signup">회원가입</Link>
            </div>
          </form>
        ) : (
          <div className="login__guest">
            <p>비회원 주문조회는 준비 중입니다.</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setTab("member")}
            >
              회원 로그인으로 이동
            </button>
          </div>
        )}

        <section className="login__sns">
          <h2>SNS 계정으로 로그인</h2>
          <div className="login__sns-buttons">
            <button type="button" className="sns-btn sns-btn--kakao">
              카카오 로그인
            </button>
            <button type="button" className="sns-btn sns-btn--naver">
              네이버 로그인
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
