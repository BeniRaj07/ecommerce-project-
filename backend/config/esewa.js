// eSewa ePay v2 sandbox (test/UAT) configuration.
// These defaults are eSewa's own publicly documented test values
// (https://developer.esewa.com.np/pages/Epay#test-credentials) — equivalent
// to Stripe's public "4242..." test card. Override via env vars for production.
export const ESEWA_CONFIG = {
  productCode: process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST',
  secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
  paymentUrl: process.env.ESEWA_PAYMENT_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  statusCheckUrl: process.env.ESEWA_STATUS_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
