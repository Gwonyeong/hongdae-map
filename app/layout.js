import localFont from "next/font/local";
import { Noto_Serif_KR, Gowun_Batang } from 'next/font/google';
import "./globals.css";
import SessionProvider from './components/SessionProvider';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// 감성적인 한글 폰트 추가
const gowunBatang = Gowun_Batang({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-gowun-batang',
});

export const metadata = {
  title: "홍대 커피 맵",
  description: "홍대 주변 커피숍을 발견하고 리뷰를 공유하세요",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${gowunBatang.variable} antialiased`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
