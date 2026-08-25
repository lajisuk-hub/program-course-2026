// 홈페이지 내용을 읽고(누구나) 저장하는(관리자만) 창구
import { readData, writeData, publicView, checkPw } from '../../../lib/store.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// 화면에 보여줄 내용 (줌 주소·자료는 빼고)
export async function GET() {
  const data = await readData();
  return Response.json(publicView(data), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

// 관리자 화면에서 부른다 — action: 'load'(전부 읽기) / 'save'(저장)
export async function POST(req) {
  try {
    const body = await req.json();
    if (!checkPw(body.pw)) {
      return Response.json({ error: '비밀번호가 맞지 않습니다.' }, { status: 401 });
    }

    if (body.action === 'save') {
      const saved = await writeData(body.data);
      return Response.json({ ok: true, data: saved });
    }

    const data = await readData();
    return Response.json({ ok: true, data });
  } catch (err) {
    console.error(err);
    return Response.json({ error: '문제가 생겼어요: ' + err.message }, { status: 500 });
  }
}
