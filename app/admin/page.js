'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { phoneText, digits, dateText } from '../../lib/util.js';
import { fileToSmallBase64 } from '../../lib/image.js';

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

const toLines = (list) => list.map((x) => `${x.name} ${phoneText(x.phone)}`).join('\n');

export default function Admin() {
  const [pw, setPw] = useState('');
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('site');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [roster, setRoster] = useState(''); // 명단 글상자 내용
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
      setRoster(toLines(out.data.students || []));
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

  // 캡처 사진에서 이름·전화번호 읽어 오기 (사진은 어디에도 저장하지 않는다)
  async function readShots(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setErr('');
    setOk('');
    setShotBusy(true);
    try {
      const found = [];
      for (const f of files) {
        const { data: image, mime } = await fileToSmallBase64(f);
        const res = await fetch('/api/read-shot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pw, image, mime }),
        });
        const out = await res.json();
        if (!res.ok) throw new Error(out.error || '사진을 읽지 못했습니다.');
        found.push(...(out.people || []));
      }

      // 글상자에 이미 있는 번호는 빼고 아래에 이어 붙인다
      const have = new Set(
        roster
          .split(/\r?\n/)
          .map((line) => digits(line))
          .filter(Boolean),
      );
      const fresh = found.filter((p) => !have.has(digits(p.phone)));
      if (!fresh.length) {
        setOk('사진에서 새로 찾은 번호가 없습니다. (이미 다 들어 있거나 번호가 안 보였어요)');
        return;
      }
      const lines = fresh.map((p) => `${p.name || '(이름 확인 필요)'} ${phoneText(p.phone)}`);
      setRoster((prev) => (prev.trim() ? prev.trimEnd() + '\n' : '') + lines.join('\n'));
      setOk(
        `사진에서 ${fresh.length}명을 찾아 아래 칸에 넣었습니다. 이름이 맞는지 확인하신 뒤 ` +
          '"명단 읽어들이기"와 "저장하기"를 눌러 주세요.',
      );
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setShotBusy(false);
    }
  }

  // 글상자 내용을 명단으로 바꾼다 (한 줄에 "이름 010-1234-5678")
  function pasteRoster(text) {
    const all = String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const rows = [];
    const bad = [];
    const seen = new Set();
    for (const line of all) {
      const parts = line.split(/[,\t]|\s+/).filter(Boolean);
      const phone = parts.find((p) => digits(p).length >= 9) || '';
      const name = parts.filter((p) => p !== phone).join(' ');
      const num = digits(phone);
      if (!name || !num) {
        bad.push(line);
        continue;
      }
      if (seen.has(num)) continue;
      seen.add(num);
      rows.push({ name, phone: num });
    }

    if (!rows.length) {
      setErr(
        '읽을 수 있는 줄이 없어요.\n"홍길동 010-1234-5678" 처럼 이름과 전화번호를 한 줄에 같이 넣어주세요.',
      );
      return;
    }
    setErr(
      bad.length
        ? `전화번호가 없어서 뺀 줄이 ${bad.length}개 있어요: ${bad.slice(0, 3).join(' / ')}`
        : '',
    );
    setData({ ...data, students: rows });
    setOk(`${rows.length}명을 읽었습니다. 맨 아래 "저장하기"를 꼭 눌러 주세요.`);
  }

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
        <div className="item">
          <p style={{ marginTop: 0 }}>
            여기 적힌 <strong>이름과 전화번호</strong>가 맞아야 강의 자료를 볼 수 있습니다.
            <br />
            <span className="muted">명단이 비어 있으면 누구나 볼 수 있으니 꼭 넣어주세요.</span>
          </p>

          <label className="f">① 캡처 사진에서 읽어오기 (카톡·문자·엑셀 화면 사진)</label>
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
              : '사진 속 이름과 휴대폰 번호를 찾아 아래 칸에 넣어 드립니다. 사진은 저장하지 않습니다.'}
          </p>

          <label className="f">② 명단 확인·고치기 (한 줄에 한 명: 홍길동 010-1234-5678)</label>
          <textarea
            id="roster"
            style={{ minHeight: 200 }}
            placeholder="홍길동 010-1234-5678"
            value={roster}
            onChange={(e) => setRoster(e.target.value)}
          />
          <p className="muted">
            이름만 있고 번호가 없는 줄은 저장되지 않습니다. 번호를 꼭 같이 적어주세요.
          </p>

          <button className="btn" style={{ marginTop: 6 }} onClick={() => pasteRoster(roster)}>
            ③ 명단 읽어들이기
          </button>

          {data.students.length > 0 && (
            <>
              <label className="f">지금 등록된 수강생 {data.students.length}명</label>
              <div
                style={{
                  maxHeight: 260,
                  overflow: 'auto',
                  border: '2px solid var(--line)',
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                {data.students.map((s, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 2px' }}
                  >
                    <span>{s.name}</span>
                    <span className="muted">{phoneText(s.phone)}</span>
                  </div>
                ))}
              </div>
              <p className="muted">
                여기까지는 아직 저장 전입니다. 맨 아래 <strong>저장하기</strong>를 꼭 눌러 주세요.
              </p>
            </>
          )}
        </div>
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
