'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { phoneText, digits, dateText, phoneProblem } from '../../lib/util.js';
import { fileToSmallBase64 } from '../../lib/image.js';
import { parsePeople } from '../../lib/parse.js';

// 명단 표에 쓰는 자잘한 모양
const TBL = { width: '100%', borderCollapse: 'collapse', fontSize: 15 };
const TH = {
  textAlign: 'left',
  padding: '8px 10px',
  background: '#f3f4f6',
  color: '#4b5563',
  fontSize: 13.5,
  position: 'sticky',
  top: 0,
};
const TD = { padding: '8px 10px', borderTop: '1px solid var(--line)' };

const newSession = (no) => ({
  id: 's' + Math.random().toString(36).slice(2, 8),
  no,
  title: '',
  date: '',
  teacher: '',
  place: '줌(온라인)',
  summary: '',
  icon: '🌱',
  zoomUrl: '',
  zoomId: '',
  zoomPw: '',
  files: [],
  videoUrl: '',
});

export default function Admin() {
  const [pw, setPw] = useState('');
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('site');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [stuName, setStuName] = useState(''); // 한 명 넣기 — 이름
  const [stuPhone, setStuPhone] = useState(''); // 한 명 넣기 — 전화번호
  const [bulk, setBulk] = useState(''); // 카톡·엑셀에서 붙여넣은 글
  const [found, setFound] = useState(null); // 찾은 사람 (아직 명단에 넣지 않은 상태)
  const [q, setQ] = useState(''); // 명단에서 찾기
  const [justAdded, setJustAdded] = useState([]); // 방금 넣은 사람 (맨 위에 보여준다)
  const [shotBusy, setShotBusy] = useState(false);

  async function login(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pw, action: 'load' }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || '들어가지 못했어요.');
      setData(out.data);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setErr('');
    setOk('');
    setBusy(true);
    try {
      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pw, action: 'save', data }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || '저장하지 못했어요.');
      setOk('저장했습니다. 홈페이지에 바로 반영됩니다.');
      setTimeout(() => setOk(''), 4000);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <main className="wrap" style={{ maxWidth: 420, paddingTop: 70 }}>
        <form className="panel" onSubmit={login}>
          <h2>관리자 화면</h2>
          <p className="muted">일정·자료·수강생 명단을 넣고 고치는 곳입니다.</p>
          <label className="f">비밀번호</label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          {err && <div className="err">{err}</div>}
          <button className="btn wide" style={{ marginTop: 16 }} disabled={busy}>
            {busy ? '확인 중…' : '들어가기'}
          </button>
          <a className="back" href="/">
            ← 홈페이지로
          </a>
        </form>
      </main>
    );
  }

  const setSite = (k, v) => setData({ ...data, site: { ...data.site, [k]: v } });

  const setSes = (i, k, v) => {
    const sessions = data.sessions.slice();
    sessions[i] = { ...sessions[i], [k]: v };
    setData({ ...data, sessions });
  };

  const moveSes = (i, dir) => {
    const sessions = data.sessions.slice();
    const j = i + dir;
    if (j < 0 || j >= sessions.length) return;
    [sessions[i], sessions[j]] = [sessions[j], sessions[i]];
    setData({ ...data, sessions: sessions.map((s, k) => ({ ...s, no: k + 1 })) });
  };

  const delSes = (i) => {
    if (!confirm(`${data.sessions[i].no}차시를 지울까요?`)) return;
    const sessions = data.sessions.filter((_, k) => k !== i).map((s, k) => ({ ...s, no: k + 1 }));
    setData({ ...data, sessions });
  };

  async function pickFile(i, fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setErr('');
    setBusy(true);
    try {
      const added = [];
      for (const f of files) {
        const blob = await upload(`materials/${f.name}`, f, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          clientPayload: pw,
        });
        added.push({ name: f.name, url: blob.url });
      }
      const sessions = data.sessions.slice();
      sessions[i] = { ...sessions[i], files: [...(sessions[i].files || []), ...added] };
      setData({ ...data, sessions });
      setOk('자료를 올렸습니다. 아래 "저장하기"를 눌러야 최종 반영됩니다.');
    } catch (e2) {
      setErr('자료를 올리지 못했어요: ' + e2.message);
    } finally {
      setBusy(false);
    }
  }

  // 맨 위 큰 그림 올리기 — 올린 뒤 곧바로 저장까지 해 준다
  async function pickHero(fileList) {
    const f = Array.from(fileList || [])[0];
    if (!f) return;
    setErr('');
    setOk('');
    setBusy(true);
    try {
      const blob = await upload(`hero/${f.name}`, f, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        clientPayload: pw,
      });
      const next = { ...data, site: { ...data.site, heroUrl: blob.url } };
      setData(next);
      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pw, action: 'save', data: next }),
      });
      if (!res.ok) throw new Error('저장하지 못했어요.');
      setOk('맨 위 그림을 바꿨습니다. 홈페이지를 새로고침하면 보입니다.');
    } catch (e2) {
      setErr('그림을 올리지 못했어요: ' + e2.message);
    } finally {
      setBusy(false);
    }
  }

  const delFile = (i, k) => {
    const sessions = data.sessions.slice();
    sessions[i] = { ...sessions[i], files: sessions[i].files.filter((_, x) => x !== k) };
    setData({ ...data, sessions });
  };

  // ── 수강생 명단 ───────────────────────────────────────────────
  // 명단은 넣거나 지우는 즉시 저장한다 (열린 강의실처럼 "넣으면 바로 반영")
  async function saveStudents(next, okMsg, added = []) {
    return saveNow({ ...data, students: next }, okMsg, added);
  }

  async function saveNow(body, okMsg, added = []) {
    setErr('');
    setOk('');
    setBusy(true);
    try {
      const res = await fetch('/api/course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pw, action: 'save', data: body }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || '저장하지 못했어요.');
      setData(out.data || body);
      setJustAdded(added);
      setOk(okMsg);
      return true;
    } catch (e2) {
      setErr(e2.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  // 여러 명을 명단에 넣는다 (이미 있는 번호는 건너뛴다). 넣은 사람 수를 돌려준다.
  async function addPeople(people) {
    const next = data.students.slice();
    const added = [];
    const names = [];
    let skipped = 0;
    for (const p of people) {
      const nm = String(p.name || '').trim();
      const num = digits(p.phone);
      if (!nm || !num) continue;
      if (next.some((s) => digits(s.phone) === num)) {
        skipped += 1;
        continue;
      }
      next.push({ name: nm, phone: num, visits: 0, lastAt: '' });
      added.push(num);
      names.push(nm);
    }
    if (!added.length) {
      setOk('');
      setErr(
        skipped
          ? '이미 명단에 있는 번호라서 넣지 않았어요.'
          : '이름과 전화번호가 모두 있어야 넣을 수 있어요.',
      );
      return 0;
    }
    const done = await saveStudents(
      next,
      `${names.join(', ')} — ${added.length}명을 명단에 넣었습니다. (저장까지 끝났어요)` +
        (skipped ? ` 이미 있던 ${skipped}명은 건너뛰었습니다.` : ''),
      added,
    );
    return done ? added.length : 0;
  }

  // ① 한 명 직접 넣기
  async function addOne(e) {
    e.preventDefault();
    setErr('');
    setOk('');
    const nm = stuName.trim();
    if (!nm) {
      setErr('이름을 넣어주세요.');
      return;
    }
    const bad = phoneProblem(stuPhone);
    if (bad) {
      setErr(bad);
      return;
    }
    const n = await addPeople([{ name: nm, phone: stuPhone }]);
    if (n) {
      setStuName('');
      setStuPhone('');
    }
  }

  // ② 붙여넣은 글에서 이름·전화번호 찾기 (아직 명단에 넣지는 않는다)
  function scan() {
    setErr('');
    setOk('');
    const people = parsePeople(bulk).map((x) => ({ ...x, on: true }));
    setFound(people);
    if (!people.length) {
      setErr(
        '전화번호를 찾지 못했어요.\n"홍길동 010-1234-5678"처럼 이름과 번호가 같이 있어야 찾을 수 있습니다.',
      );
    }
  }

  const setFoundRow = (i, patch) =>
    setFound((f) => f.map((x, n) => (n === i ? { ...x, ...patch } : x)));

  // ② 캡처 사진에서 읽어 오기 — 찾은 결과는 아래 표에 모으고, 확인한 뒤에 넣는다
  // (사진은 어디에도 저장하지 않는다)
  async function readShots(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setErr('');
    setOk('');
    setShotBusy(true);
    try {
      const got = [];
      for (const f of files) {
        const { data: image, mime } = await fileToSmallBase64(f);
        const res = await fetch('/api/read-shot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pw, image, mime }),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out.error || '사진을 읽지 못했습니다.');
        got.push(...(out.people || []));
      }
      // 이미 찾아 둔 사람과 합친다 (같은 번호는 한 번만)
      setFound((old) => {
        const merged = [...(old || [])];
        for (const g of got) {
          const num = digits(g.phone);
          if (!num || merged.some((x) => digits(x.phone) === num)) continue;
          merged.push({ name: g.name || '', phone: num, on: true });
        }
        return merged;
      });
      setOk(
        got.length
          ? `사진에서 ${got.length}명을 찾았습니다. 아래 「찾은 사람」에서 확인하고 넣어 주세요.`
          : '사진에서 전화번호를 찾지 못했습니다.',
      );
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setShotBusy(false);
    }
  }

  // 「찾은 사람」에서 고른 사람만 명단에 넣기
  async function saveFound() {
    const pick = (found || []).filter((x) => x.on && x.name.trim());
    if (!pick.length) return;
    const n = await addPeople(pick);
    if (n) {
      setFound(null);
      setBulk('');
    }
  }

  // 명단에서 한 명 지우기
  async function delStudent(row) {
    if (
      !confirm(
        `${row.name}(${phoneText(row.phone)}) 님을 명단에서 지울까요?\n지우면 이분은 강의 자료를 볼 수 없습니다.`,
      )
    ) {
      return;
    }
    const next = data.students.filter((s) => s !== row);
    await saveStudents(next, `${row.name} 님을 명단에서 지웠습니다.`, []);
  }

  // 못 들어온 기록 — 「위 칸에 옮기기」: ① 한 명 넣기 칸에 채워 준다 (확인하고 넣으시라고)
  function moveTry(t) {
    setStuName(t.name || '');
    setStuPhone(phoneText(t.phone) || '');
    setErr('');
    setOk('맨 위 「① 한 명 넣기」 칸에 옮겨 놓았습니다. 이름이 맞는지 보시고 「＋ 명단에 넣기」를 눌러 주세요.');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function clearTries() {
    if (!confirm('못 들어온 기록을 모두 지울까요?\n(명단은 그대로 있습니다)')) return;
    await saveNow({ ...data, tries: [] }, '못 들어온 기록을 비웠습니다.', []);
  }

  const qq = q.trim();
  const qNum = digits(qq);
  const isNew = (s) => justAdded.includes(digits(s.phone));
  // 「찾은 사람」 중에서 실제로 넣을 수 있는 사람 (이미 명단에 있는 번호는 뺀다)
  const pickable = (found || []).filter(
    (x) =>
      x.on &&
      x.name.trim() &&
      !data.students.some((s) => digits(s.phone) === digits(x.phone)),
  );
  const tries = Array.isArray(data.tries) ? data.tries : [];
  const shownStudents = data.students
    .filter((s) => !qq || s.name.includes(qq) || (qNum && digits(s.phone).includes(qNum)))
    .slice()
    .sort((a, b) => (isNew(b) ? 1 : 0) - (isNew(a) ? 1 : 0));

  return (
    <main className="wrap" style={{ paddingTop: 28 }}>
      <h2 style={{ color: 'var(--blue-dark)' }}>관리자 화면</h2>

      <div className="tabs">
        <button className={tab === 'site' ? 'on' : ''} onClick={() => setTab('site')}>
          기본 설정
        </button>
        <button className={tab === 'ses' ? 'on' : ''} onClick={() => setTab('ses')}>
          교육 일정 ({data.sessions.length})
        </button>
        <button className={tab === 'stu' ? 'on' : ''} onClick={() => setTab('stu')}>
          수강생 명단 ({data.students.length})
        </button>
      </div>

      {tab === 'site' && (
        <div className="item">
          <label className="f">맨 위 큰 그림</label>
          {data.site.heroUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.site.heroUrl}
                alt="맨 위 그림"
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
              <button
                className="small red"
                style={{ marginTop: 8 }}
                onClick={() => setData({ ...data, site: { ...data.site, heroUrl: '' } })}
              >
                이 그림 빼기
              </button>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              지금은 홈페이지에 넣어 둔 기본 표지가 나옵니다. 아래에서 그림을 고르면 바뀝니다.
            </p>
          )}
          <input
            type="file"
            accept="image/*"
            style={{ marginTop: 8, border: 'none', padding: 0 }}
            onChange={(e) => pickHero(e.target.files)}
          />
          <p className="muted">
            가로로 긴 그림(예: 1920×1080)이 가장 잘 맞습니다. 고르면 바로 저장됩니다.
          </p>

          <label className="f">과정 이름</label>
          <input value={data.site.title} onChange={(e) => setSite('title', e.target.value)} />

          <label className="f">한 줄 문구</label>
          <input value={data.site.slogan} onChange={(e) => setSite('slogan', e.target.value)} />

          <label className="f">기간 (예: 2026년 9월 ~ 11월)</label>
          <input value={data.site.period} onChange={(e) => setSite('period', e.target.value)} />

          <label className="f">과정 안내글</label>
          <textarea value={data.site.intro} onChange={(e) => setSite('intro', e.target.value)} />

          <label className="f">카카오톡 문의 주소 (오픈채팅방 또는 채널 주소)</label>
          <input
            value={data.site.kakaoUrl}
            onChange={(e) => setSite('kakaoUrl', e.target.value)}
            placeholder="https://open.kakao.com/o/..."
          />

          <label className="f">교육 거래명세서 받는 곳 주소</label>
          <input
            value={data.site.receiptUrl || ''}
            onChange={(e) => setSite('receiptUrl', e.target.value)}
            placeholder="https://wmentor-receipt.vercel.app/?c=..."
          />

          <label className="f">수료증 받는 곳 주소</label>
          <input
            value={data.site.certUrl}
            onChange={(e) => setSite('certUrl', e.target.value)}
            placeholder="https://wmentor-edu-docs.vercel.app/g/..."
          />

          <label className="f">수료증을 열어 줄 날짜</label>
          <input
            type="date"
            value={data.site.certOpenAt || ''}
            onChange={(e) => setSite('certOpenAt', e.target.value)}
          />
          <p className="muted">
            이 날짜가 되기 전에는 수강생이 눌러도 &quot;○월 ○일부터 받으실 수 있습니다&quot;라고만
            나오고, 주소도 감춰집니다. 날짜를 비우면 곧바로 열립니다.
          </p>

          <label className="f">공지사항 제목 (없으면 비워 두세요)</label>
          <input
            value={data.site.noticeTitle}
            onChange={(e) => setSite('noticeTitle', e.target.value)}
          />

          <label className="f">공지사항 내용</label>
          <textarea
            value={data.site.noticeBody}
            onChange={(e) => setSite('noticeBody', e.target.value)}
          />
        </div>
      )}

      {tab === 'ses' && (
        <>
          {data.sessions.map((s, i) => (
            <div className="item" key={s.id}>
              <div className="hd">
                <strong>
                  {s.no}차시 {s.title || '(제목 없음)'}
                </strong>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button className="small" onClick={() => moveSes(i, -1)}>
                    ↑
                  </button>
                  <button className="small" onClick={() => moveSes(i, 1)}>
                    ↓
                  </button>
                  <button className="small red" onClick={() => delSes(i)}>
                    지우기
                  </button>
                </span>
              </div>

              <div className="row2">
                <div>
                  <label className="f">제목</label>
                  <input value={s.title} onChange={(e) => setSes(i, 'title', e.target.value)} />
                </div>
                <div>
                  <label className="f">날짜와 시간</label>
                  <input
                    type="datetime-local"
                    value={s.date}
                    onChange={(e) => setSes(i, 'date', e.target.value)}
                  />
                </div>
              </div>

              <div className="row2">
                <div>
                  <label className="f">강사</label>
                  <input value={s.teacher} onChange={(e) => setSes(i, 'teacher', e.target.value)} />
                </div>
                <div>
                  <label className="f">그림글자 (아이콘)</label>
                  <input value={s.icon} onChange={(e) => setSes(i, 'icon', e.target.value)} />
                </div>
              </div>

              <label className="f">한 줄 소개</label>
              <input value={s.summary} onChange={(e) => setSes(i, 'summary', e.target.value)} />

              <label className="f">줌 주소</label>
              <input
                value={s.zoomUrl}
                onChange={(e) => setSes(i, 'zoomUrl', e.target.value)}
                placeholder="https://us02web.zoom.us/j/..."
              />

              <div className="row2">
                <div>
                  <label className="f">회의 ID</label>
                  <input value={s.zoomId} onChange={(e) => setSes(i, 'zoomId', e.target.value)} />
                </div>
                <div>
                  <label className="f">회의 암호</label>
                  <input value={s.zoomPw} onChange={(e) => setSes(i, 'zoomPw', e.target.value)} />
                </div>
              </div>

              <label className="f">강의안 파일 (PDF·PPT·한글 등)</label>
              {(s.files || []).map((f, k) => (
                <div className="filerow" key={k}>
                  <span className="nm">📎 {f.name}</span>
                  <button className="small red" onClick={() => delFile(i, k)}>
                    빼기
                  </button>
                </div>
              ))}
              <input
                type="file"
                multiple
                style={{ marginTop: 8, border: 'none', padding: 0 }}
                onChange={(e) => pickFile(i, e.target.files)}
              />

              <label className="f">녹화본 주소 (유튜브 &apos;일부공개&apos; 주소를 붙여넣으세요)</label>
              <input
                value={s.videoUrl}
                onChange={(e) => setSes(i, 'videoUrl', e.target.value)}
                placeholder="https://youtu.be/..."
              />

              <p className="muted" style={{ marginBottom: 0 }}>
                수강생 화면에는 이렇게 보입니다 → {dateText(s.date)}
              </p>
            </div>
          ))}

          <button
            className="btn ghost"
            style={{ marginTop: 14 }}
            onClick={() =>
              setData({
                ...data,
                sessions: [...data.sessions, newSession(data.sessions.length + 1)],
              })
            }
          >
            ＋ 차시 추가하기
          </button>
        </>
      )}

      {tab === 'stu' && (
        <>
          <div className="item">
            <div className="hd">
              <strong>① 한 명 넣기</strong>
            </div>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              여기 적힌 <strong>이름과 전화번호</strong>가 맞아야 강의 자료를 볼 수 있습니다. 명단이
              비어 있으면 누구나 볼 수 있으니 꼭 넣어주세요.
            </p>
            <form onSubmit={addOne}>
              <div className="row2">
                <div>
                  <label className="f">이름</label>
                  <input
                    type="text"
                    value={stuName}
                    onChange={(e) => setStuName(e.target.value)}
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="f">전화번호</label>
                  <input
                    type="tel"
                    value={stuPhone}
                    onChange={(e) => setStuPhone(e.target.value)}
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>
              <button className="btn" style={{ marginTop: 12 }} disabled={busy}>
                ＋ 명단에 넣기
              </button>
            </form>
          </div>

          <div className="item">
            <div className="hd">
              <strong>② 캡처 사진 · 카톡 내용에서 찾기</strong>
            </div>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              찾은 사람은 <strong>바로 명단에 들어가지 않습니다.</strong> 아래 「찾은 사람」에서 확인하고
              고른 사람만 넣습니다.
            </p>

            <label className="f">📷 캡처 사진에서 읽기 (여러 장도 됩니다)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={shotBusy}
              style={{ border: 'none', padding: 0 }}
              onChange={(e) => {
                readShots(e.target.files);
                e.target.value = '';
              }}
            />
            <p className="muted">
              {shotBusy
                ? '사진을 읽는 중입니다… 10초쯤 걸려요.'
                : 'AI가 사진 속 글자를 읽어 이름·전화번호를 찾아 드립니다. 사진은 저장하지 않습니다.'}
            </p>

            <label className="f">또는 카톡·엑셀 내용 붙여넣기</label>
            <textarea
              value={bulk}
              onChange={(e) => {
                setBulk(e.target.value);
                setFound(null);
              }}
              placeholder={
                '예)\n[Web발신] 홍길동님 결제 완료 010-1234-5678\n\n또는\n홍길동 010-1234-5678\n김영희 010-2222-3333'
              }
            />
            <button
              className="btn ghost"
              style={{ marginTop: 8 }}
              onClick={scan}
              disabled={busy || !bulk.trim()}
            >
              🔎 이름 · 전화번호 찾기
            </button>

            {found && found.length > 0 && (
              <>
                <label className="f">찾은 사람 {found.length}명 — 확인하고 넣어 주세요</label>
                <p className="muted">
                  이름이 비었거나 잘못 찾았으면 직접 고쳐 주세요. 넣지 않을 사람은 왼쪽 체크를 꺼주시면
                  됩니다.
                </p>
                <div style={{ overflowX: 'auto', border: '2px solid var(--line)', borderRadius: 10 }}>
                  <table style={TBL}>
                    <thead>
                      <tr>
                        <th style={TH}>넣기</th>
                        <th style={TH}>이름</th>
                        <th style={TH}>전화번호</th>
                        <th style={TH}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {found.map((f, i) => {
                        const already = data.students.find(
                          (s) => digits(s.phone) === digits(f.phone),
                        );
                        return (
                          <tr key={f.phone}>
                            <td style={TD}>
                              <input
                                type="checkbox"
                                checked={f.on}
                                style={{ width: 20, height: 20 }}
                                onChange={() => setFoundRow(i, { on: !f.on })}
                              />
                            </td>
                            <td style={TD}>
                              <input
                                type="text"
                                value={f.name}
                                placeholder="이름을 넣어주세요"
                                style={{ minWidth: 110 }}
                                onChange={(e) => setFoundRow(i, { name: e.target.value })}
                              />
                            </td>
                            <td style={{ ...TD, whiteSpace: 'nowrap' }}>{phoneText(f.phone)}</td>
                            <td
                              style={{
                                ...TD,
                                whiteSpace: 'nowrap',
                                fontWeight: 700,
                                color: already ? '#b91c1c' : f.name.trim() ? '#047857' : '#b45309',
                              }}
                            >
                              {already
                                ? `이미 있음(${already.name})`
                                : f.name.trim()
                                  ? '새로 등록'
                                  : '이름 필요'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {pickable.length > 0 ? (
                  <button
                    className="btn"
                    style={{ marginTop: 12 }}
                    onClick={saveFound}
                    disabled={busy}
                  >
                    ✅ 고른 {pickable.length}명 명단에 넣기
                  </button>
                ) : (
                  <p className="muted">
                    새로 넣을 사람이 없습니다. (모두 이미 명단에 있거나 이름이 비어 있어요)
                  </p>
                )}
              </>
            )}
          </div>

          <div className="item">
            <div className="hd">
              <strong>수강생 명단 {data.students.length}명</strong>
              {justAdded.length > 0 && (
                <span className="muted">방금 넣은 {justAdded.length}명은 ✨ 표시로 맨 위에 있어요</span>
              )}
            </div>
            <input
              type="text"
              style={{ marginTop: 10 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔎 이름이나 전화번호로 찾기"
            />
            <p className="muted">
              명단은 넣거나 지우면 <strong>바로 저장</strong>됩니다. 맨 아래 「저장하기」를 따로 누르지
              않아도 됩니다.
            </p>
            <div
              style={{
                maxHeight: 430,
                overflow: 'auto',
                border: '2px solid var(--line)',
                borderRadius: 10,
              }}
            >
              <table style={TBL}>
                <thead>
                  <tr>
                    <th style={TH}>이름</th>
                    <th style={TH}>전화번호</th>
                    <th style={TH}>입장</th>
                    <th style={TH}>마지막 입장</th>
                    <th style={TH} />
                  </tr>
                </thead>
                <tbody>
                  {shownStudents.map((s, i) => (
                    <tr key={`${digits(s.phone)}-${i}`} style={isNew(s) ? { background: '#fffbeb' } : undefined}>
                      <td style={TD}>
                        {isNew(s) && '✨ '}
                        <strong>{s.name}</strong>
                      </td>
                      <td style={{ ...TD, whiteSpace: 'nowrap' }}>{phoneText(s.phone)}</td>
                      <td style={TD}>{Number(s.visits) || 0}회</td>
                      <td style={{ ...TD, whiteSpace: 'nowrap', color: 'var(--gray)' }}>
                        {s.lastAt ? dateText(s.lastAt, true) : '—'}
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <button className="small red" onClick={() => delStudent(s)} disabled={busy}>
                          지우기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shownStudents.length === 0 && (
              <p className="muted">
                {qq ? '찾는 사람이 없습니다.' : '아직 명단이 비어 있습니다.'}
              </p>
            )}
          </div>

          <div className="item">
            <div className="hd">
              <strong>못 들어온 기록 {tries.length > 0 ? `(${tries.length})` : ''}</strong>
            </div>
            <p className="muted" style={{ margin: '6px 0 0' }}>
              명단에 없어서 못 들어온 분들입니다. <strong>이름이나 번호가 한 자만 달라도</strong> 못
              들어오니, 아래에서 확인하고 맞는 분이면 「위 칸에 옮기기」를 눌러 명단에 넣어 주세요.
            </p>
            {tries.length === 0 ? (
              <p className="muted" style={{ marginTop: 10 }}>아직 없습니다.</p>
            ) : (
              <>
                <div
                  style={{
                    marginTop: 10,
                    maxHeight: 340,
                    overflow: 'auto',
                    border: '2px solid var(--line)',
                    borderRadius: 10,
                  }}
                >
                  <table style={TBL}>
                    <thead>
                      <tr>
                        <th style={TH}>넣은 이름</th>
                        <th style={TH}>넣은 전화번호</th>
                        <th style={TH}>시도</th>
                        <th style={TH}>마지막 시각</th>
                        <th style={TH} />
                      </tr>
                    </thead>
                    <tbody>
                      {tries.map((t, i) => (
                        <tr key={`${digits(t.phone)}-${t.name}-${i}`}>
                          <td style={TD}>
                            <strong>{t.name || '—'}</strong>
                          </td>
                          <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                            {phoneText(t.phone) || '—'}
                          </td>
                          <td style={TD}>{Number(t.count) || 1}회</td>
                          <td style={{ ...TD, whiteSpace: 'nowrap', color: 'var(--gray)' }}>
                            {t.at ? dateText(t.at, true) : '—'}
                          </td>
                          <td style={{ ...TD, textAlign: 'right' }}>
                            <button className="small" onClick={() => moveTry(t)} disabled={busy}>
                              위 칸에 옮기기
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="small"
                  style={{ marginTop: 12 }}
                  onClick={clearTries}
                  disabled={busy}
                >
                  기록 비우기
                </button>
              </>
            )}
          </div>
        </>
      )}

      {err && <div className="err">{err}</div>}
      {ok && <div className="ok">{ok}</div>}

      <div className="savebar">
        <button className="btn wide" onClick={save} disabled={busy}>
          {busy ? '저장 중…' : '저장하기'}
        </button>
      </div>

      <a className="back" href="/">
        ← 홈페이지 보기
      </a>
    </main>
  );
}
