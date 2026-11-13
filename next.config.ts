import type { NextConfig } from "next";

// 全部のパスに付ける、ブラウザの安全のためのヘッダー。
// CSP は Firebase・フォントの読み込みをこわすおそれがあるので入れていない（docs/03-technical.md 9章）
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // カメラは このサイトの中だけ。マイクと位置情報は使わない
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
