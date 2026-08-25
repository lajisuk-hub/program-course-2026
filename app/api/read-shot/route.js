// 휴대폰 캡처 사진에서 이름과 전화번호를 읽어 준다.
// 관리자 비밀번호가 맞을 때만 동작하고, 사진은 어디에도 저장하지 않는다.
import { checkPw } from '../../../lib/store.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PROMPT = `이 그림은 휴대폰이나 컴퓨터 화면을 캡처한 사진입니다. (카카오톡 대화, 문자, 신청서 목록, 엑셀 표 등)
여기에서 "사람 이름"과 "휴대폰 번호"를 찾아주세요.

규칙:
- 휴대폰 번호는 010, 011, 016, 017, 018, 019 로 시작하는 번호만 찾습니다. 숫자만 남겨 적습니다. (예: 01012345678)
- 이름은 그 번호의 주인으로 보이는 사람 이름만 적습니다. 확실하지 않으면 빈 문자열로 둡니다.
- 은행 이름, 회사 이름, 대표번호(1588 등), 금액은 무시합니다.
- 같은 번호가 여러 번 나오면 한 번만 적습니다.

답은 아래 형식의 JSON 배열로만 하세요. 설명은 절대 쓰지 마세요.
[{"name":"홍길동","phone":"01012345678"}]
찾은 것이 없으면 [] 만 답하세요.`;

export async function POST(req) {
  try {
    const { pw, image, mime } = await req.json();

    if (!checkPw(pw)) {
      return Response.json({ error: '비밀번호가 맞지 않습니다.' }, { status: 401 });
    }
    if (!image) return Response.json({ error: '사진이 없습니다.' }, { status: 400 });
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: '사진 읽기 기능이 아직 준비되지 않았습니다. (열쇠값 없음)' },
        { status: 500 },
      );
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        thinking: { type: 'disabled' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mime || 'image/jpeg', data: image },
              },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('read-shot', r.status, detail.slice(0, 300));
      return Response.json({ error: '사진을 읽지 못했습니다. 잠시 뒤 다시 해주세요.' }, { status: 502 });
    }

    const j = await r.json();
    const text = (j.content || []).map((c) => c.text || '').join('\n');
    const m = text.match(/\[[\s\S]*\]/);
    let people = [];
    try {
      people = m ? JSON.parse(m[0]) : [];
    } catch (err) {
      people = [];
    }

    // 번호 모양이 맞는 것만 남긴다
    const seen = new Set();
    const out = [];
    for (const p of Array.isArray(people) ? people : []) {
      const phone = String(p?.phone || '').replace(/[^0-9]/g, '');
      if (!/^01[016789]\d{8}$/.test(phone) || seen.has(phone)) continue;
      seen.add(phone);
      out.push({ name: String(p?.name || '').trim().slice(0, 20), phone });
    }

    return Response.json({ people: out });
  } catch (e) {
    console.error('read-shot', e);
    return Response.json({ error: '사진을 읽지 못했습니다.' }, { status: 500 });
  }
}
