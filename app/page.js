'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Hero from './Hero.js';
import Enter from './Enter.js';
import KakaoIcon from './KakaoIcon.js';
import { QUICK } from '../lib/defaults.js';
import { BENEFITS, BENEFIT_FOOT, SESSION_COLORS } from '../lib/content.js';
import { dateText, sessionState, STATE_LABEL, loadMe, clearMe } from '../lib/util.js';

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
    } else if (key === 'receipt') {
      if (site.receiptUrl) window.open(site.receiptUrl, '_blank', 'noopener');
      else setMsg('교육 거래명세서 발급이 아직 준비 중입니다. 곧 이곳에서 받으실 수 있어요.');
    } else if (key === 'kakao') {
      if (site.kakaoUrl) window.open(site.kakaoUrl, '_blank', 'noopener');
      else setMsg('문의 채널이 아직 등록되지 않았어요. 관리자 화면에서 카카오톡 주소를 넣어주세요.');
    } else if (key === 'cert') {
      if (site.certOpen && site.certUrl) window.open(site.certUrl, '_blank', 'noopener');
      else if (!site.certOpen)
        setMsg(`수료증은 ${dateText(site.certOpenAt)}부터 이곳에서 받으실 수 있습니다.`);
      else setMsg('수료증은 과정을 마친 뒤 이곳에서 받으실 수 있습니다. (준비 중)');
    }
  }

  return (
    <>
      <Hero title={site.title} slogan={site.slogan} heroUrl={site.heroUrl} />

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
              <div className="ico">
                {q.key === 'kakao' ? (
                  <span className="kbubble">
                    <KakaoIcon size={22} />
                  </span>
                ) : (
                  q.icon
                )}
              </div>
              <div className="label">{q.label}</div>
              <div className="desc">
                {q.key === 'cert' && !site.certOpen && site.certOpenAt
                  ? `${dateText(site.certOpenAt)} 공개`
                  : q.desc}
              </div>
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

        {/* ── 2026 프로그램과정의 핵심 (원장님 안내 그림) ── */}
        <h2 className="h2" id="core">
          ✨ 2026 프로그램과정의 핵심
        </h2>

        <section className="shot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/core.jpg" alt="2026 프로그램과정의 핵심 — 철학·오감·자연·사회정서·문해력·하브루타·환경감수성·놀이·신체·디지털 설계" />
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
          {BENEFITS.map((b) => {
            const inner = (
              <>
                <div className="bhd">
                  <span className="bno" style={{ background: b.color }}>
                    {b.no}
                  </span>
                  <strong>{b.title}</strong>
                </div>
                <div className="bico">{b.icon}</div>
                <p>{b.body}</p>
                {b.url && <span className="bgo">{b.go || '바로 가기'} →</span>}
              </>
            );
            return b.url ? (
              <a
                className="ben link"
                key={b.no}
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <div className="ben" key={b.no}>
                {inner}
              </div>
            );
          })}
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
              <KakaoIcon size={20} />
              {site.kakaoText || '카카오톡으로 문의하기'}
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

      {site.kakaoUrl && (
        <a
          className="kfloat"
          href={site.kakaoUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="카카오톡으로 문의하기"
        >
          <KakaoIcon size={26} />
          <span>문의하기</span>
        </a>
      )}

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
