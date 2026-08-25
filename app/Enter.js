'use client';

import { useState } from 'react';
import { phoneProblem, saveMe } from '../lib/util.js';

// 수강생 확인 팝업 — 이름과 전화번호가 명단과 맞아야 자료를 볼 수 있다.
export default function Enter({ onDone, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!name.trim()) return setErr('이름을 넣어주세요.');
    const p = phoneProblem(phone);
    if (p) return setErr(p);

    setBusy(true);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || '확인하지 못했어요.');
      const me = { name: name.trim(), phone };
      saveMe(me);
      onDone(me);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dim" onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <form className="pop" onSubmit={submit}>
        <h3>수강생 확인</h3>
        <p className="sub">신청하실 때 적으신 이름과 전화번호를 넣어주세요.</p>

        <label className="f" htmlFor="nm">
          이름
        </label>
        <input
          id="nm"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          autoComplete="name"
        />

        <label className="f" htmlFor="ph">
          전화번호
        </label>
        <input
          id="ph"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010-1234-5678"
          autoComplete="tel"
        />

        {err && <div className="err">{err}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          {onClose && (
            <button type="button" className="btn gray" onClick={onClose} style={{ flex: '0 0 auto' }}>
              닫기
            </button>
          )}
          <button type="submit" className="btn wide" disabled={busy}>
            {busy ? '확인 중…' : '들어가기'}
          </button>
        </div>

        <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
          한 번 확인하면 이 기기에서는 다음부터 바로 들어갑니다.
        </p>
      </form>
    </div>
  );
}
