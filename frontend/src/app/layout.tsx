import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const pretendard = localFont({
  src: [
    {
      path: "../fonts/PretendardVariable.woff2",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: "NextStep — AI가 설계하는 나만의 학습 경로",
  description: "목표 직무를 입력하면 AI가 현재 수준에 맞는 최적의 학습 로드맵을 생성합니다. 빠른 취업 경로와 기본기 경로 중 선택하세요.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "NextStep — AI가 설계하는 나만의 학습 경로",
    description: "목표 직무를 입력하면 AI가 현재 수준에 맞는 최적의 학습 로드맵을 생성합니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "NextStep",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextStep — AI가 설계하는 나만의 학습 경로",
    description: "목표 직무를 입력하면 AI가 현재 수준에 맞는 최적의 학습 로드맵을 생성합니다.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${pretendard.variable} font-sans bg-[#0a0a0f] text-white min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
