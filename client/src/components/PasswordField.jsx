import { useState } from "react";
import EyeIcon from "./EyeIcon";

function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  hint,
  required = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="field">
      {label && <span>{label}</span>}
      <div className="field__input field__input--plain">
        <input
          type={visible ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
        <button
          type="button"
          className="field__toggle"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        >
          <EyeIcon />
        </button>
      </div>
      {hint && <small className="field__hint">{hint}</small>}
    </label>
  );
}

export default PasswordField;
