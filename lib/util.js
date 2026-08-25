// 화면과 서버가 함께 쓰는 자잘한 도우미들

// 전화번호에서 숫자만 남기기 (010-1234-5678 → 01012345678)
export const digits = (s) => String(s || '').replace(/[^0-9]/g, '');

// 보기 좋게 010-1234-5678 로
export function phoneText(s) {
  const d = digits(s);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d;
}

// 전화번호 형식 확인 (010이면 11자리) — 오타 한 자로 못 들어오는 일을 줄인다
export function phoneProblem(s) {
  const d = digits(s);
  if (!d) return '전화번호를 넣어주세요.';
  if (d.length < 9) return '전화번호가 너무 짧습니다. 숫자를 다시 확인해 주세요.';
  if (d.startsWith('010') && d.length !== 11) {
    return '휴대폰 번호는 010으로 시작하는 11자리입니다. 다시 확인해 주세요.';
  }
  return '';
}

// 이름 비교는 너그럽게 한다.
// 띄어쓰기와 괄호 안 설명을 빼고 견준다 — "조숙현(예꿈)" 도 "조숙현" 으로 들어올 수 있게.
export const nameKey = (s) =>
  String(s || '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/\s+/g, '');

// 유튜브 주소에서 영상 번호만 뽑기 (여러 형태를 모두 받아준다)
export function youtubeId(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  const m = s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{6,})/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{8,}$/.test(s)) return s;
  return '';
}

export const embedUrl = (url) => {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : '';
};

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

// 2026-09-03T19:00 → 9월 3일(수) 오후 7:00
export function dateText(iso, withYear = false) {
  if (!iso) return '날짜 미정';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  const head = withYear ? `${d.getFullYear()}년 ` : '';
  const time = String(iso).includes('T') ? ` ${ampm} ${h12}:${mm}` : '';
  return `${head}${d.getMonth() + 1}월 ${d.getDate()}일(${WEEK[d.getDay()]})${time}`;
}

// 오늘을 기준으로 예정 / 오늘 / 지난 강의 구분
export function sessionState(iso) {
  if (!iso) return 'soon';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'soon';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return 'today';
  return d.getTime() > now.getTime() ? 'soon' : 'done';
}

export const STATE_LABEL = { soon: '예정', today: '오늘 강의', done: '지난 강의' };

// 한 번 확인한 사람은 이 컴퓨터에 기억해 둔다 (다음에 바로 입장)
const KEY = 'program-course-2026:me';

export function loadMe() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function saveMe(me) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(me));
  } catch (err) {
    /* 저장이 막혀 있어도 이용에는 문제없다 */
  }
}

export function clearMe() {
  try {
    window.localStorage.removeItem(KEY);
  } catch (err) {
    /* 무시 */
  }
}
