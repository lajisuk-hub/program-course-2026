// 이름·전화번호를 확인한 뒤 그 차시의 줌 주소·강의안·녹화본을 내보낸다.
import { readData, writeData } from '../../../lib/store.js';
import { digits, nameKey } from '../../../lib/util.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

// 들어온 횟수를 센다 (관리자 화면에서 누가 들어와 봤는지 보시라고).
// 같은 사람이 짧은 사이에 여러 번 눌러도 한 번으로 센다.
const AGAIN = 10 * 60 * 1000;

async function markVisit(data, idx) {
  const s = data.students[idx];
  const last = s.lastAt ? new Date(s.lastAt).getTime() : 0;
  if (last && Date.now() - last < AGAIN) return;
  const students = data.students.slice();
  students[idx] = {
    ...s,
    visits: (Number(s.visits) || 0) + 1,
    lastAt: new Date().toISOString(),
  };
  await writeData({ ...data, students });
}

export async function POST(req) {
  try {
    const { id, name, phone } = await req.json();
    const data = await readData();

    const who = nameKey(name);
    const num = digits(phone);
    if (!who || !num) {
      return Response.json({ error: '이름과 전화번호를 넣어주세요.' }, { status: 400 });
    }

    // 명단이 아직 없으면 누구나 들어올 수 있다 (원장님이 미리 확인해 보실 수 있게)
    if (data.students.length > 0) {
      const idx = data.students.findIndex(
        (s) => nameKey(s.name) === who && digits(s.phone) === num,
      );
      if (idx < 0) {
        return Response.json(
          {
            error:
              '명단에서 찾지 못했어요. 이름과 전화번호를 다시 확인해 주세요.\n그래도 안 되면 카카오톡으로 문의해 주세요.',
          },
          { status: 403 },
        );
      }
      try {
        await markVisit(data, idx);
      } catch (err) {
        /* 횟수를 세지 못해도 들어오는 데는 문제없다 */
      }
    }

    // 차시를 지정하지 않으면 확인만 하고 끝낸다 (첫 입장 확인용)
    if (!id) return Response.json({ ok: true });

    const s = data.sessions.find((x) => x.id === id);
    if (!s) return Response.json({ error: '그 강의를 찾지 못했어요.' }, { status: 404 });

    return Response.json({
      ok: true,
      session: {
        id: s.id,
        no: s.no,
        title: s.title,
        date: s.date,
        teacher: s.teacher,
        place: s.place,
        summary: s.summary,
        icon: s.icon,
        zoomUrl: s.zoomUrl || '',
        zoomId: s.zoomId || '',
        zoomPw: s.zoomPw || '',
        files: Array.isArray(s.files) ? s.files : [],
        videoUrl: s.videoUrl || '',
      },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: '문제가 생겼어요: ' + err.message }, { status: 500 });
  }
}
