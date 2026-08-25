'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Hero from './Hero.js';
import Enter from './Enter.js';
import { QUICK } from '../lib/defaults.js';
import {
  CORE_STEPS,
  CORE_ITEMS,
  BENEFITS,
  BENEFIT_FOOT,
  SESSION_COLORS,
} from '../lib/content.js';
import { dateText, sessionState, STATE_LABEL, loadMe, clearMe } from '../lib/util.js';

// 문장 안의 한 낱말만 색으로 강조한다
function Hi({ text, word }) {
  const i = text.indexOf(word);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <b className="hi">{word}</b>
      {text.slice(i + word.length)}
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [ask, setAsk] = useState(null); // 확인 후 갈 곳
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setMe(loadMe());
    fetch('/api/course')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ site: {}, sessions: [] }));
  }, []);

  if (!data) {
    return (
      <main className="wrap" style={{ paddingTop: 60, textAlign: 'center' }}>
        <p className="muted">잠시만 기다려 주세요…</p>
      </main>
    );
  }

  const site = data.site || {};
  const sessions = data.sessions || [];

  // 자료를 보려면 먼저 수강생 확인을 거친다
  function goSession(id) {
    if (me) router.push(`/session/${id}`);
    else setAsk(`/session/${id}`);
  }

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  function quickClick(key) {
    setMsg('');
    if (key === 'schedule') {
      scrollTo('schedule');
    } else if (key === 'material') {
      setMsg('아래 일정에서 강의를 고르시면 그 차시의 강의안과 녹화본을 보실 수 있어요.');
      scrollTo('schedule');
    } else if (key === 'kakao') {
      if (site.kakaoUrl) window.open(site.kakaoUrl, '_blank', 'noopener');
      else setMsg('문의 채널이 아직 등록되지 않았어요. 관리자 화면에서 카카오톡 주소를 넣어주세요.');
    } else if (key === 'cert') {
      if (site.certUrl) window.open(site.certUrl, '_blank', 'noopener');
      else setMsg('수료증은 모든 과정을 마친 뒤 이곳에서 받으실 수 있습니다. (준비 중)');
    }
  }

  return (
    <>
      <Hero title={site.title} slogan={site.slogan} />

      <main className="wrap">
        <section className="intro">
          {site.period && <span className="period">{site.period}</span>}
          <p>{site.intro}</p>
          {me && (
            <p className="muted" style={{ marginTop: 12 }}>
              <strong>{me.name}</strong> 님, 반갑습니다.{' '}
              <button
                className="small"
                onClick={() => {
                  clearMe();
                  setMe(null);
                }}
              >
                다른 사람으로 바꾸기
              </button>
            </p>
          )}
        </section>

        <div className="quick">
          {QUICK.map((q) => (
            <button key={q.key} onClick={() => quickClick(q.key)}>
              <div className="ico">{q.icon}</div>
              <div className="label">{q.label}</div>
              <div className="desc">{q.desc}</div>
            </button>
          ))}
        </div>

        {msg && <div className="ok">{msg}</div>}

        {site.noticeTitle && (
          <section className="notice">
            <h3>📢 {site.noticeTitle}</h3>
            <p>{site.noticeBody}</p>
          </section>
        )}

        {/* ── 2026 프로그램과정의 핵심 ───────────────────── */}
        <h2 className="h2" id="core">
          ✨ 2026 프로그램과정의 핵심
        </h2>

        <section className="core">
          <ol className="steps">
            {CORE_STEPS.map((s, i) => (
              <li key={i}>
                <span className="dot">{s.icon}</span>
                <span>
                  <Hi text={s.text} word={s.hi} />
                </span>
              </li>
            ))}
          </ol>

          <div className="coregrid">
            {CORE_ITEMS.map((c) => (
              <div className="corecard" key={c.no}>
                <span className="cno" style={{ background: c.color }}>
                  {c.no}
                </span>
                <span className="cico">{c.icon}</span>
                <span className="cnm">{c.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 교육 일정 ─────────────────────────────────── */}
        <h2 className="h2" id="schedule">
          📅 교육 일정
        </h2>
        <p className="muted" style={{ marginTop: -6 }}>
          차시를 누르면 <strong>줌 링크 · 강의안 · 녹화본</strong>을 보실 수 있습니다.
        </p>

        {sessions.length === 0 ? (
          <p className="muted">아직 등록된 일정이 없습니다.</p>
        ) : (
          <div className="flow">
            {sessions.map((s, i) => {
              const st = sessionState(s.date);
              const color = SESSION_COLORS[i % SESSION_COLORS.length];
              const dim = st === 'done';
              return (
                <a
                  key={s.id}
                  className={`step ${st}`}
                  href={`/session/${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    goSession(s.id);
                  }}
                >
                  <span className="sno" style={{ background: dim ? '#9aa5b5' : color }}>
                    {s.no}차
                  </span>
                  <span className="sdate">{dateText(s.date)}</span>
                  <span className="sline" />
                  <span className="sico">{s.icon}</span>
                  <span className="stitle">{s.title}</span>
                  {s.teacher && <span className="stch">{s.teacher}</span>}
                  <span className="smark">
                    {s.hasZoom && <b>🎥</b>}
                    {s.fileCount > 0 && <b>📄</b>}
                    {s.hasVideo && <b>▶</b>}
                    {!s.hasZoom && !s.fileCount && !s.hasVideo && (
                      <i>준비 중</i>
                    )}
                  </span>
                  {st === 'today' && <span className="stoday">오늘</span>}
                </a>
              );
            })}
          </div>
        )}
        <p className="muted" style={{ textAlign: 'center', marginTop: 14 }}>
          * 일정은 상황에 따라 변경될 수 있습니다.
        </p>

        {/* ── 이번 과정에서 얻어가는 것 ─────────────────── */}
        <h2 className="h2" id="benefit">
          🎁 이번 과정에서 얻어가는 것
        </h2>

        <div className="bens">
          {BENEFITS.map((b) => (
            <div className="ben" key={b.no}>
              <div className="bhd">
                <span className="bno" style={{ background: b.color }}>
                  {b.no}
                </span>
                <strong>{b.title}</strong>
              </div>
              <div className="bico">{b.icon}</div>
              <p>{b.body}</p>
            </div>
          ))}
        </div>
        <p className="benfoot">🌿 {BENEFIT_FOOT}</p>

        {/* ── 문의 ─────────────────────────────────────── */}
        <h2 className="h2" id="ask">
          💬 문의
        </h2>
        <section className="panel" style={{ marginTop: 0, textAlign: 'center' }}>
          <p style={{ marginTop: 0 }}>궁금한 점은 언제든지 카카오톡으로 물어보세요.</p>
          {site.kakaoUrl ? (
            <a className="btn kakao" href={site.kakaoUrl} target="_blank" rel="noopener noreferrer">
              💬 {site.kakaoText || '카카오톡으로 문의하기'}
            </a>
          ) : (
            <p className="muted">문의 채널이 아직 등록되지 않았어요.</p>
          )}
        </section>

        <p className="foot">
          {site.title} · 수강생 전용 공간
          <br />
          <a href="/admin" className="muted">
            관리자
          </a>
        </p>
      </main>

      {ask && (
        <Enter
          onClose={() => setAsk(null)}
          onDone={(m) => {
            setMe(m);
            const to = ask;
            setAsk(null);
            router.push(to);
          }}
        />
      )}
    </>
  );
}
