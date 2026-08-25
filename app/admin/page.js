'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { phoneText, digits, dateText } from '../../lib/util.js';

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
      setErr(
        '자료를 올리지 못했어요: ' +
          e2.message +
          '\n(내 컴퓨터에서 시험 중이면 보관함이 없어 올리기가 안 됩니다. Vercel에 올린 뒤 해 주세요.)',
      );
    } finally {
      setBusy(false);
    }
  }

  const delFile = (i, k) => {
    const sessions = data.sessions.slice();
    sessions[i] = { ...sessions[i], files: sessions[i].files.filter((_, x) => x !== k) };
    setData({ ...data, sessions });
  };

  // 명단 붙여넣기: 한 줄에 "이름 010-1234-5678"
  function pasteRoster(text) {
    const rows = String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,\t]|\s{1,}/).filter(Boolean);
        const phone = parts.find((p) => digits(p).length >= 9) || '';
        const name = parts.filter((p) => p !== phone).join(' ');
        return { name, phone: digits(phone) };
      })
      .filter((r) => r.name && r.phone);
    if (!rows.length) {
      setErr('읽을 수 있는 줄이 없어요. "홍길동 010-1234-5678" 처럼 한 줄에 한 명씩 넣어주세요.');
      return;
    }
    setErr('');
    setData({ ...data, students: rows });
    setOk(`${rows.length}명을 읽었습니다. 아래 "저장하기"를 눌러 주세요.`);
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
          <label className="f">과정 이름</label>
          <input value={data.site.title} onChange={(e) => setSite('title', e.target.value)} />

          <label className="f">한 줄 문구</label>
          <input value={data.site.slogan} onChange={(e) => setSite('slogan', e.target.value)} />

          <label className="f">기간 (예: 2026년 9월 ~ 10월)</label>
          <input value={data.site.period} onChange={(e) => setSite('period', e.target.value)} />

          <label className="f">과정 안내글</label>
          <textarea value={data.site.intro} onChange={(e) => setSite('intro', e.target.value)} />

          <label className="f">카카오톡 문의 주소 (오픈채팅방 또는 채널 주소)</label>
          <input
            value={data.site.kakaoUrl}
            onChange={(e) => setSite('kakaoUrl', e.target.value)}
            placeholder="https://open.kakao.com/o/..."
          />

          <label className="f">수료증 받는 곳 주소</label>
          <input
            value={data.site.certUrl}
            onChange={(e) => setSite('certUrl', e.target.value)}
            placeholder="https://wmentor-edu-docs.vercel.app/..."
          />
          <p className="muted">비워 두면 &quot;준비 중&quot;이라고 안내됩니다.</p>

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
              setData({ ...data, sessions: [...data.sessions, newSession(data.sessions.length + 1)] })
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

          <label className="f">명단 붙여넣기 (한 줄에 한 명: 홍길동 010-1234-5678)</label>
          <textarea
            id="roster"
            placeholder={'홍길동 010-1234-5678\n김보육 010-2222-3333'}
            defaultValue={data.students.map((s) => `${s.name} ${phoneText(s.phone)}`).join('\n')}
          />
          <button
            className="btn"
            style={{ marginTop: 10 }}
            onClick={() => pasteRoster(document.getElementById('roster').value)}
          >
            명단 읽어들이기
          </button>

          {data.students.length > 0 && (
            <>
              <label className="f">지금 등록된 수강생 {data.students.length}명</label>
              <div style={{ maxHeight: 260, overflow: 'auto', border: '2px solid var(--line)', borderRadius: 10, padding: 10 }}>
                {data.students.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 2px' }}>
                    <span>{s.name}</span>
                    <span className="muted">{phoneText(s.phone)}</span>
                  </div>
                ))}
              </div>
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
