// 강의안 파일을 보관함에 올리기 위한 창구.
// 파일은 브라우저에서 보관함으로 곧장 올라가므로(서버를 거치지 않음)
// 용량이 큰 강의안(PPT·PDF)도 문제없이 올라간다.
import { handleUpload } from '@vercel/blob/client';
import { checkPw } from '../../../lib/store.js';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/haansofthwp',
  'application/x-hwp',
  'application/hwp',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // 한글(.hwp·.hwpx) 등 종류를 모르는 파일
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
];

export async function POST(request) {
  try {
    const body = await request.json();

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 관리자 비밀번호를 아는 사람만 올릴 수 있다
        if (!checkPw(clientPayload)) throw new Error('올릴 권한이 없어요.');
        return {
          allowedContentTypes: ALLOWED,
          maximumSizeInBytes: 100 * 1024 * 1024, // 한 파일 100MB까지
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
