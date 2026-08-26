// 카톡·문자에 온 결제 알림을 통째로 붙여넣으면 이름과 전화번호를 찾아 준다. (2026-08-22)
// 원장님이 손으로 옮겨 적지 않게 하려는 것이 목적이라, 확실한 것만 찾고 나머지는 화면에서 고치게 한다.

import { digits } from './util.js';

// 이름으로 볼 수 없는 낱말 (결제 알림에 흔히 섞여 있는 말)
const STOP = [
  '입금', '출금', '결제', '완료', '승인', '취소', '환불', '금액', '잔액', '계좌', '은행', '예금주', '송금', '이체',
  '수수료', '카드', '체크', '신용', '간편', '카카오', '카카오페이', '토스', '네이버', '페이', '주문', '상품', '수량',
  '배송', '고객', '확인', '발신', '수신', '문자', '알림', '안내', '광고', '안녕', '감사', '연락', '전화', '휴대',
  '번호', '이름', '성함', '교육', '강의', '신청', '접수', '등록', '오전', '오후', '일시', '메모', '비고', '내용',
  '원장', '선생', '선생님', '어린이집', '연구소', '영유아', '수강', '이용', '기간', '만원', '천원', '사용',
  '신한', '국민', '우리', '하나', '농협', '기업', '새마을', '우체국', '수협', '부산', '대구', '광주', '전북', '경남',
  '케이', '카뱅', '토스뱅크', '씨티', '산업', '저축', '증권', '머니', '포인트', '쿠폰',
];

const isStop = (w) => STOP.some((s) => w === s || w.includes(s));

// 010-1234-5678 · 01012345678 · +82 10 1234 5678 모두 잡는다
const PHONE = /(?:\+?82[-.\s]?)?(01[016789])[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g;

// 사람 이름이 아닌 흔한 말 (조사·인사말 등)
const CHATTER = [
  '방금', '지금', '오늘', '어제', '내일', '아까', '혹시', '정말', '문의', '부탁', '입니다', '습니다', '했습니다',
  '드립니다', '주세요', '주신', '주셔서', '보냈습니다', '보냅니다', '안녕하세요', '감사합니다', '수고', '여기',
  '이거', '그거', '저기', '해서', '해요', '했어요', '됩니다', '있습니다', '없습니다', '드림', '올림', '자동',
  '시스템', '강의실', '링크', '주소', '사이트', '연구', '디자인',
];

// 이름 후보 고르기 — 한글 덩어리를 낱말 단위로 잘라서 본다.
// 가까이 있는 말을 가장 먼저 보고, '님'이 붙은 말은 조금 더 쳐준다.
function bestName(text, phoneAt) {
  let best = null;
  const re = /[가-힣]+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const run = m[0];
    if (run.length > 5) continue;                       // '입금했습니다' 같은 긴 덩어리는 이름이 아니다

    let word = run;
    let honorific = false;
    for (const tail of ['원장님', '선생님', '님', '씨']) {
      if (word.length > tail.length + 1 && word.endsWith(tail)) {
        word = word.slice(0, -tail.length);
        honorific = true;
        break;
      }
    }
    if (word.length < 2 || word.length > 4) continue;
    if (isStop(word) || CHATTER.includes(word)) continue;

    const dist = Math.abs(m.index - phoneAt);
    const score = dist - (honorific ? 8 : 0) - (word.length === 3 ? 2 : 0);
    if (!best || score < best.score) best = { name: word, score };
  }
  return best ? best.name : '';
}

// 붙여넣은 글에서 {name, phone} 목록 뽑기 (전화번호 기준, 중복 제거)
// 같은 줄에 있는 이름을 가장 믿고, 없으면 바로 앞 두 줄, 그다음 뒷줄을 살핀다.
export function parsePeople(text) {
  const src = String(text || '').replace(/ /g, ' ');
  const lines = src.split(/\r?\n/);
  const out = [];
  const seen = new Set();

  lines.forEach((line, li) => {
    let m;
    PHONE.lastIndex = 0;
    while ((m = PHONE.exec(line)) !== null) {
      const phone = digits(m[1] + m[2] + m[3]);
      if (phone.length !== 11 || seen.has(phone)) continue;
      seen.add(phone);

      // 이 줄에서 전화번호 부분만 빼고 이름을 찾는다
      const sameLine = line.slice(0, m.index) + ' '.repeat(m[0].length) + line.slice(m.index + m[0].length);
      let name = bestName(sameLine, m.index);

      if (!name) {
        for (let back = 1; back <= 2 && !name; back += 1) {
          const prev = lines[li - back];
          if (prev && prev.trim()) name = bestName(prev, prev.length);
        }
      }
      if (!name) {
        const next = lines[li + 1];
        if (next && next.trim()) name = bestName(next, 0);
      }

      out.push({ name, phone });
    }
  });

  return out;
}
