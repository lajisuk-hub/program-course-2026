'use client';

import { useState } from 'react';

// 맨 위 큰 그림. public/hero.png 를 넣어 두면 그 그림이 나오고,
// 아직 넣지 않았으면 같은 느낌의 글자 화면이 대신 나온다.
export default function Hero({ title, slogan }) {
  const [broken, setBroken] = useState(false);

  if (!broken) {
    return (
      <div className="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero.png" alt={title} onError={() => setBroken(true)} />
      </div>
    );
  }

  const chars = Array.from(String(title || '').replace(/\s/g, ''));

  return (
    <div className="hero">
      <div className="hero-fallback">
        <div className="tiles">
          {chars.map((c, i) => (
            <span key={i} className={'tile' + (i >= chars.length - 6 ? ' on' : '')}>
              {c}
            </span>
          ))}
        </div>
        <h1>{title}</h1>
        <p>{slogan}</p>
      </div>
    </div>
  );
}
