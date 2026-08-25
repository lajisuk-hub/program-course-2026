// 원장님이 주신 안내 그림 3장의 내용을 홈페이지 글자로 옮긴 것.
// (그림 그대로 넣지 않고 글자로 만들어서, 휴대폰에서도 잘 보이고 눌러서 넘어갈 수 있게 했습니다)

// ── "2026 프로그램과정의 핵심!" 그림 ──────────────────────
export const CORE_STEPS = [
  { text: '먼저 철학이 있어야 합니다.', hi: '철학', icon: '💗' },
  { text: '그 다음 아이를 이해해야 합니다.', hi: '아이', icon: '🧒' },
  { text: '그리고 놀이를 이해해야 합니다.', hi: '놀이', icon: '🪁' },
  { text: '마지막에 우리 원에 맞게 설계해야 합니다.', hi: '설계', icon: '🏠' },
  { text: '그래서 이번 과정은', hi: '이번 과정', icon: '⭐' },
];

export const CORE_ITEMS = [
  { no: 1, name: '철학', icon: '❤️', color: '#ef4444' },
  { no: 2, name: '오감', icon: '🖐️', color: '#f59e0b' },
  { no: 3, name: '자연', icon: '🍃', color: '#22c55e' },
  { no: 4, name: '사회정서', icon: '👥', color: '#3b82f6' },
  { no: 5, name: '문해력', icon: '📖', color: '#14b8a6' },
  { no: 6, name: '하브루타', icon: '💬', color: '#8b5cf6' },
  { no: 7, name: '환경감수성', icon: '🌍', color: '#16a34a' },
  { no: 8, name: '놀이', icon: '🧩', color: '#f59e0b' },
  { no: 9, name: '신체', icon: '🏃', color: '#ec4899' },
  { no: 10, name: '디지털 설계', icon: '🖥️', color: '#2563eb' },
];

// ── "이번 과정에서 얻어가는 것" 그림 ─────────────────────
export const BENEFITS = [
  {
    no: 1,
    icon: '🎬',
    title: '매 차시 녹화본 제공',
    body: '실시간 참여가 어려워도 다시 보며 복습할 수 있습니다.',
    color: '#22c55e',
  },
  {
    no: 2,
    icon: '🧸',
    title: '우수 프로그램 사례',
    body: '현장에서 검증된 프로그램을 직접 소개합니다.',
    color: '#3b82f6',
  },
  {
    no: 3,
    icon: '🗂️',
    title: '프로그램 기획 자동화',
    body: '소장이 직접 사용하는 프로그램 기획 방법과 자동화 시스템을 안내합니다.',
    color: '#ef4444',
    url: 'https://wmentor-program-planner.vercel.app/',
    go: '기획 도우미 열기',
  },
  {
    no: 4,
    icon: '💻',
    title: '우리원 프로그램 기획 사이트 제공',
    body:
      '교육청 프로그램과 함께 우리 원만의 프로그램을 쉽게 설계할 수 있도록 직접 제작한 기획 사이트 사용 방법도 제공합니다.',
    color: '#8b5cf6',
  },
];

export const BENEFIT_FOOT =
  '이론과 실제를 연결한 교육으로 우리 기관만의 특별한 프로그램을 만들어보세요!';

// 차시 카드에 돌아가며 쓰는 색 (안내 그림과 같은 느낌)
export const SESSION_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#0ea5e9',
  '#a855f7',
];
