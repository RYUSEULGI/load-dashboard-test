import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Log Dashboard (v1)",
  description: "대량 로그 스트림 대시보드 — 성능 개선 전 출발점",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
