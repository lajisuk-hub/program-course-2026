'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Enter from '../../Enter.js';
import { dateText, sessionState, STATE_LABEL, embedUrl, loadMe } from '../../../lib/util.js';

export default function SessionPage() {
  const { id } = useParams();
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [ses, setSes] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const saved = loadMe();
    setMe(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!me || !id) return;
    setErr('');
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: me.name, phone: me.phone }),
    })
      .then(async (r) => {
        const out = await r.json();
        if (!r.ok) throw new Error(out.error || '강의를 불러오지 못했어요.');
        return out;
      })
      .then((out) => setSes(out.session))
      .catch((e) => setErr(e.message));
  }, [me, id]);

  if (!ready) return null;

  if (!me) {
    return (
      <main className="wrap" style={{ paddingTop: 40 }}>
        <p className="muted">수강생 확인이 필요합니다.</p>
        <Enter onDone={setMe} />
      </main>
    );
  }

  if (err) {
    return (
      <main className="wrap" style={{ paddingTop: 40 }}>
        <div className="err">{err}</div>
        <a className="back" href="/">
          ← 처음 화면으로
        </a>
      </main>
    );
  }

  if (!ses) {
    return (
      <main className="wrap" style={{ paddingTop: 40 }}>
        <p className="muted">잠시만 기다려 주세요…</p>
      </main>
    );
  }

  const st = sessionState(ses.date);

  return (
    <main className="wrap" style={{ paddingTop: 28 }}>
      <a className="back" href="/" style={{ marginTop: 0 }}>
        ← 처음 화면으로
      </a>

      <section className="panel">
        <div className="top" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="no">{ses.no}차시</span>
          <span className={`badge ${st}`}>{STATE_LABEL[st]}</span>
        </div>
        <h2 style={{ marginTop: 8 }}>
          {ses.icon ? `${ses.icon} ` : ''}
          {ses.title}
        </h2>
        <div className="when" style={{ color: 'var(--blue)', fontWeight: 700 }}>
          {dateText(ses.date, true)}
          {ses.place ? ` · ${ses.place}` : ''}
          {ses.teacher ? ` · ${ses.teacher}` : ''}
        </div>
        {ses.summary && <p style={{ marginBottom: 0 }}>{ses.summary}</p>}
      </section>

      {/* 1) 줌으로 들어가기 */}
      <section className="panel">
        <h2>🎥 줌으로 들어가기</h2>
        {ses.zoomUrl ? (
          <>
            <a className="btn wide" href={ses.zoomUrl} target="_blank" rel="noopener noreferrer">
              줌 강의실 입장하기
            </a>
            {(ses.zoomId || ses.zoomPw) && (
              <p className="muted" style={{ marginBottom: 0 }}>
                {ses.zoomId && (
                  <>
                    회의 ID: <strong>{ses.zoomId}</strong>
                  </>
                )}
                {ses.zoomId && ses.zoomPw ? ' · ' : ''}
                {ses.zoomPw && (
                  <>
                    암호: <strong>{ses.zoomPw}</strong>
                  </>
                )}
              </p>
            )}
          </>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            줌 주소는 강의 하루 전까지 이곳에 올라옵니다.
          </p>
        )}
      </section>

      {/* 2) 강의안 내려받기 */}
      <section className="panel">
        <h2>📄 강의안 받기</h2>
        {ses.files && ses.files.length > 0 ? (
          ses.files.map((f, i) => (
            <div className="filerow" key={i}>
              <span className="nm">📎 {f.name}</span>
              <a
                className="btn"
                href={`/api/file?u=${encodeURIComponent(f.url)}&n=${encodeURIComponent(f.name)}`}
              >
                내려받기
              </a>
            </div>
          ))
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            강의안은 강의 시작 전에 이곳에 올라옵니다.
          </p>
        )}
      </section>

      {/* 3) 녹화본 다시보기 */}
      <section className="panel">
        <h2>▶ 녹화본 다시보기</h2>
        {embedUrl(ses.videoUrl) ? (
          <div className="video">
            <iframe
              src={embedUrl(ses.videoUrl)}
              title={ses.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : ses.videoUrl ? (
          <a className="btn wide" href={ses.videoUrl} target="_blank" rel="noopener noreferrer">
            녹화본 보러 가기
          </a>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>
            녹화본은 강의가 끝난 뒤 며칠 안에 올라옵니다.
          </p>
        )}
      </section>

      <a className="back" href="/">
        ← 처음 화면으로
      </a>
    </main>
  );
}
