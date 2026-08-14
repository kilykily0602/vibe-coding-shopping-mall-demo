export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_HINT = "8자 이상, 영문, 숫자, 특수문자 포함";

export function getErrorMessage(error, fallback) {
  if (error instanceof TypeError) {
    return "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해 주세요.";
  }

  return error?.message || fallback;
}
