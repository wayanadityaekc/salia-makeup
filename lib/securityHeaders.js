const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=()';
const REFERRER_POLICY = 'strict-origin-when-cross-origin';
const ENFORCED_CSP = "frame-ancestors 'none'; object-src 'none'; base-uri 'self'";

export function buildSecurityHeaders() {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: REFERRER_POLICY },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'Content-Security-Policy', value: ENFORCED_CSP },
  ];
}
