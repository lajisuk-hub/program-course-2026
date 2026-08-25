// 카카오톡 말풍선 모양 아이콘 (그림 파일 없이 그려서 어떤 화면에서도 또렷하게 보인다)
export default function KakaoIcon({ size = 22, color = '#3C1E1E' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3C6.48 3 2 6.52 2 10.86c0 2.79 1.85 5.24 4.63 6.63-.2.73-.74 2.68-.85 3.1-.13.52.19.51.4.37.17-.11 2.67-1.81 3.75-2.55.67.1 1.36.15 2.07.15 5.52 0 10-3.52 10-7.7S17.52 3 12 3z" />
    </svg>
  );
}
