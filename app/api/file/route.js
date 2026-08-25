// 강의안을 원래 이름 그대로 내려받게 해 주는 창구.
// 보관함 주소로 곧장 받으면 파일 이름이 "1%ED%9A%8C..."처럼 깨져서 저장되기 때문에,
// 여기서 한글 이름을 제대로 붙여 다시 전해 준다.

export const runtime = 'edge';

// 우리 보관함 주소만 통과시킨다 (아무 주소나 대신 받아 주는 통로가 되지 않도록)
const BLOB_HOST = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('u') || '';
  const name = searchParams.get('n') || 'file';

  if (!BLOB_HOST.test(url)) {
    return new Response('올바른 자료 주소가 아니에요.', { status: 400 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return new Response('자료를 찾지 못했어요.', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
  const len = upstream.headers.get('content-length');
  if (len) headers.set('Content-Length', len);
  // filename*= 를 써야 한글 이름이 그대로 저장된다
  headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
  headers.set('Cache-Control', 'public, max-age=3600');

  return new Response(upstream.body, { headers });
}
