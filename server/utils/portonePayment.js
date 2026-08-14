function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPortOnePayment(paymentId) {
  const secret = process.env.PORTONE_API_SECRET;
  if (!secret) {
    const error = new Error(
      'PORTONE_API_SECRET이 서버에 설정되지 않았습니다. server/.env에 포트원 API Secret을 넣어 주세요.'
    );
    error.status = 500;
    throw error;
  }

  const res = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `PortOne ${secret}`,
      },
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(
      data.message || data.type || '포트원 결제 조회에 실패했습니다.'
    );
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function fetchPortOnePaymentWithRetry(paymentId, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const payment = await fetchPortOnePayment(paymentId);
      if (
        payment?.status === 'PAID' ||
        payment?.status === 'VIRTUAL_ACCOUNT_ISSUED'
      ) {
        return payment;
      }
      if (i < attempts - 1) await sleep(700 * (i + 1));
      lastError = null;
      if (i === attempts - 1) return payment;
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await sleep(700 * (i + 1));
    }
  }
  if (lastError) throw lastError;
  return null;
}

/**
 * 결제 검증. 성공 시 payment 객체 반환.
 * @param {string} paymentId
 * @param {number} expectedAmount 장바구니 합계
 */
async function verifyPaidPayment(paymentId, expectedAmount) {
  if (!paymentId) {
    const error = new Error('paymentId가 필요합니다.');
    error.status = 400;
    throw error;
  }

  const payment = await fetchPortOnePaymentWithRetry(paymentId);
  const status = payment?.status;
  const paidAmount = Number(payment?.amount?.total ?? payment?.amount ?? NaN);

  if (status !== 'PAID') {
    const error = new Error(
      status
        ? `결제가 완료되지 않았습니다. (상태: ${status})`
        : '결제가 완료되지 않았습니다.'
    );
    error.status = 400;
    error.paymentStatus = status || 'UNKNOWN';
    throw error;
  }

  if (Number.isFinite(paidAmount) && paidAmount !== Number(expectedAmount)) {
    const error = new Error(
      `결제 금액이 주문 금액과 다릅니다. (결제 ${paidAmount} / 주문 ${expectedAmount})`
    );
    error.status = 400;
    error.paymentStatus = status;
    throw error;
  }

  return payment;
}

module.exports = {
  fetchPortOnePayment,
  fetchPortOnePaymentWithRetry,
  verifyPaidPayment,
};
