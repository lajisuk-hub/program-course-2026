'use client';

import { useState } from 'react';

// 맨 위 큰 그림.
// 1) 관리자 화면에서 올린 그림(heroUrl)이 있으면 그것을 쓰고
// 2) 없으면 public/hero.jpg 를 쓰고
// 3) 그것도 없으면 원본 안내 그림과 비슷한 글자 화면을 대신 보여준다.

const ROW1 = ['2', '0', '2', '6'];
const ROW2 = ['어', '린', '이', '집'];
const ROW3 = ['프', '로', '그', '램', '교', '육', '과', '정'];

const MARKS = [
  { icon: '🤍', label: '아이 중심' },
  { icon: '🌱', label: '놀이 기반' },
  { icon: '💡', label: '창의·탐구' },
  { icon: '🤝', label: '협력·소통' },
];

export default function Hero({ title, slogan, heroUrl }) {
  const [broken, setBroken] = useState(false);
  const src = heroUrl || '/hero.jpg';

  if (!broken) {
    return (
      <div className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} onError={() => setBroken(true)} />
      </div>
    );
  }

  // 문구를 "앞부분, 뒷부분"으로 나눠 뒤쪽만 진한 파랑으로 (원본 그림과 같은 느낌)
  const parts = String(slogan || '').split(',');

  return (
    <div className="hero">
      <div className="hero-fallback">
        <div className="tiles">
          {ROW1.map((c, i) => (
            <span key={i} className={'tile num' + (i === 3 ? ' on' : '')}>
              {c}
            </span>
          ))}
        </div>
        <div className="tiles">
          {ROW2.map((c, i) => (
            <span key={i} className="tile big">
              {c}
            </span>
          ))}
        </div>
        <div className="tiles">
          {ROW3.map((c, i) => (
            <span key={i} className="tile big on">
              {c}
            </span>
          ))}
        </div>

        <p className="slog">
          <span className="bar" />
          {parts[0]}
          {parts.length > 1 && ','}
          {parts.length > 1 && <b>{parts.slice(1).join(',')}</b>}
          <span className="bar" />
        </p>

        <div className="marks">
          {MARKS.map((m) => (
            <span key={m.label}>
              <i>{m.icon}</i>
              {m.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
