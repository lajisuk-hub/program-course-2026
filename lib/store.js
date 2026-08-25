// 홈페이지 내용(일정·명단·설정)을 한 곳에 보관하고 꺼내오는 곳.
//
// Vercel에 올라가면 보관함(Vercel Blob)에 저장하고,
// 내 컴퓨터에서 시험할 때는 .data/course.json 파일에 저장한다.
// (그래서 보관함을 연결하기 전에도 화면을 다 확인해 볼 수 있다)

import { put, list, del } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_DATA } from './defaults.js';

// 보관함은 누구나 주소를 알면 읽을 수 있으므로, 명단(이름·전화번호)이 든 이 파일은
// 매번 이름 뒤에 아무도 모르는 임의의 글자를 붙여 저장한다(주소를 짐작할 수 없게).
const BLOB_KEY = 'course/data.json';
const BLOB_PREFIX = 'course/data';
const LOCAL_FILE = path.join(process.cwd(), '.data', 'course.json');

const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// 빠진 항목이 있어도 화면이 깨지지 않게 기본값으로 채워 준다
function normalize(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    site: { ...DEFAULT_DATA.site, ...(data.site || {}) },
    students: Array.isArray(data.students) ? data.students : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
  };
}

export async function readData() {
  try {
    if (hasBlob()) {
      const { blobs } = await list({ prefix: BLOB_PREFIX });
      if (!blobs.length) return normalize(DEFAULT_DATA);
      // 가장 최근에 저장한 것부터 읽어본다.
      // (막 저장한 파일은 아주 잠깐 안 읽힐 수 있어서, 그럴 땐 바로 앞의 것을 쓴다)
      const sorted = blobs
        .slice()
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      for (const b of sorted) {
        const res = await fetch(b.url, { cache: 'no-store' });
        if (res.ok) return normalize(await res.json());
      }
      return normalize(DEFAULT_DATA);
    }
    const text = await fs.readFile(LOCAL_FILE, 'utf8');
    return normalize(JSON.parse(text));
  } catch (err) {
    // 아직 저장한 적이 없는 경우 등 — 견본 내용을 보여준다
    return normalize(DEFAULT_DATA);
  }
}

export async function writeData(data) {
  const clean = normalize(data);
  if (hasBlob()) {
    await put(BLOB_KEY, JSON.stringify(clean), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });
    // 오래된 것은 지운다 (최근 3개만 남겨 둔다)
    try {
      const { blobs } = await list({ prefix: BLOB_PREFIX });
      const old = blobs
        .slice()
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(3);
      if (old.length) await del(old.map((b) => b.url));
    } catch (err) {
      /* 정리에 실패해도 저장 자체에는 문제없다 */
    }
    return clean;
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(clean, null, 2), 'utf8');
  return clean;
}

export const adminPw = () => String(process.env.ADMIN_PW || '1234');

export const checkPw = (pw) => String(pw || '') === adminPw();

// 수강생에게 내보내도 되는 내용만 골라낸다.
// (줌 주소·강의안·녹화본은 이름·전화번호를 확인한 뒤에만 내보낸다)
export function publicView(data) {
  return {
    site: data.site,
    hasRoster: data.students.length > 0,
    sessions: data.sessions.map((s) => ({
      id: s.id,
      no: s.no,
      title: s.title,
      date: s.date,
      teacher: s.teacher,
      place: s.place,
      summary: s.summary,
      icon: s.icon,
      hasZoom: Boolean(s.zoomUrl),
      fileCount: Array.isArray(s.files) ? s.files.length : 0,
      hasVideo: Boolean(s.videoUrl),
    })),
  };
}
