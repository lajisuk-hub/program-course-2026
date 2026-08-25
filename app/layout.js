import './globals.css';

export const metadata = {
  title: '2026 어린이집 프로그램 교육과정',
  description: '아이의 오늘을 소중히, 내일을 더 빛나게 — 수강생 전용 교육 공간',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
