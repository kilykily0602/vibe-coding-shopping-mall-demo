import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordField from "../components/PasswordField";
import {
  PASSWORD_HINT,
  PASSWORD_RULE,
  getErrorMessage,
} from "../utils/authForm";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allChecked =
    agreements.terms && agreements.privacy && agreements.marketing;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgreeAll = (checked) => {
    setAgreements({
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
  };

  const handleAgreeChange = (name, checked) => {
    setAgreements((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!PASSWORD_RULE.test(form.password)) {
      setError("비밀번호는 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!agreements.terms || !agreements.privacy) {
      setError("필수 약관에 동의해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          user_type: "customer",
          marketing_agree: agreements.marketing,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("서버 응답을 처리할 수 없습니다.");
      }

      if (!res.ok) {
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }

      navigate("/login");
    } catch (err) {
      setError(getErrorMessage(err, "회원가입에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup">
      <div className="signup__header">
        <h1>회원가입</h1>
        <p>새로운 계정을 만들어 쇼핑을 시작하세요</p>
      </div>

      <form className="signup__form" onSubmit={handleSubmit}>
        <label className="field">
          <span>이름</span>
          <input
            type="text"
            name="name"
            placeholder="이름"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label className="field">
          <span>이메일</span>
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <PasswordField
          label="비밀번호"
          name="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={handleChange}
          required
        />

        <PasswordField
          label="비밀번호 확인"
          name="confirmPassword"
          placeholder="비밀번호 확인"
          value={form.confirmPassword}
          onChange={handleChange}
          hint={PASSWORD_HINT}
          required
        />

        <div className="agreements">
          <label className="agree agree--all">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => handleAgreeAll(e.target.checked)}
            />
            <span>전체 동의</span>
          </label>

          <label className="agree">
            <input
              type="checkbox"
              checked={agreements.terms}
              onChange={(e) => handleAgreeChange("terms", e.target.checked)}
            />
            <span>이용약관 동의 (필수)</span>
            <button type="button" className="agree__view">
              보기
            </button>
          </label>

          <label className="agree">
            <input
              type="checkbox"
              checked={agreements.privacy}
              onChange={(e) => handleAgreeChange("privacy", e.target.checked)}
            />
            <span>개인정보처리방침 동의 (필수)</span>
            <button type="button" className="agree__view">
              보기
            </button>
          </label>

          <label className="agree">
            <input
              type="checkbox"
              checked={agreements.marketing}
              onChange={(e) => handleAgreeChange("marketing", e.target.checked)}
            />
            <span>마케팅 정보 수신 동의 (선택)</span>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={loading}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>

        <p className="signup__footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </main>
  );
}

export default RegisterPage;
