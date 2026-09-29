/**
 * 펀펀 플레이 입장 관리
 *  - 로그인하면 서버가 "로그인 확인표"(쿠키)를 줌
 *  - 놀이터에서 포인트를 내고 게임을 시작할 때만 "게임 입장권"(쿠키, 이용 시간만큼 유효)을 줌
 *  - /games/... 게임 파일은 입장권이 있어야만 열림 → 즐겨찾기·주소 직접 입력으로는 못 들어감
 *  - 마스터(선생님)는 로그인만 하면 언제든 입장 가능
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Express, Request, Response, NextFunction } from 'express';

const AUTH_COOKIE = 'tp_auth';
const FUN_COOKIE = 'tp_fun';
const AUTH_DAYS = 30;

let SECRET = process.env.SESSION_SECRET || '';

function loadSecret(dataDir: string) {
  if (SECRET) return;
  const file = path.join(dataDir, '.session-secret');
  try {
    if (fs.existsSync(file)) SECRET = fs.readFileSync(file, 'utf-8').trim();
  } catch {}
  if (!SECRET) {
    SECRET = crypto.randomBytes(32).toString('hex');
    try {
      fs.writeFileSync(file, SECRET, 'utf-8');
    } catch {}
  }
}

function sign(payload: Record<string, any>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verify(token: string | undefined): Record<string, any> | null {
  if (!token || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expect = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
  } catch {
    return null;
  }
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (typeof p.exp === 'number' && p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

function readCookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function cookieOpts(req: Request, maxAgeMs: number) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return { httpOnly: true, sameSite: 'lax' as const, secure, path: '/', maxAge: maxAgeMs };
}

/** 로그인 성공 시 호출 */
export function setLoginCookie(req: Request, res: Response, userId: string, role: 'student' | 'master') {
  const exp = Date.now() + AUTH_DAYS * 24 * 3600 * 1000;
  res.cookie(AUTH_COOKIE, sign({ uid: userId, role, exp }), cookieOpts(req, AUTH_DAYS * 24 * 3600 * 1000));
}

export function readLogin(req: Request): { uid: string; role: string } | null {
  const p = verify(readCookies(req)[AUTH_COOKIE]);
  return p && p.uid ? { uid: String(p.uid), role: String(p.role || 'student') } : null;
}

/* ---------------------------------------------------------------------------
 * 펀펀 플레이 무료 개방 (선생님이 기간을 정하면 그동안 포인트 없이 무제한)
 * ------------------------------------------------------------------------- */
export interface FunfunFreeSettings {
  freeFrom: number; // 시작 시각(ms)
  freeUntil: number; // 끝 시각(ms)
  note: string; // 학생에게 보여 줄 한마디
  updatedAt: number;
}
let freeSettings: FunfunFreeSettings = { freeFrom: 0, freeUntil: 0, note: '', updatedAt: 0 };
let settingsFile = '';

function saveFree() {
  if (!settingsFile) return;
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(freeSettings), 'utf-8');
  } catch {}
}
export function getFunfunFree(): FunfunFreeSettings {
  return { ...freeSettings };
}
export function setFunfunFree(v: Partial<FunfunFreeSettings>) {
  freeSettings = {
    freeFrom: Math.max(0, Number(v.freeFrom) || 0),
    freeUntil: Math.max(0, Number(v.freeUntil) || 0),
    note: String(v.note || '').slice(0, 80),
    updatedAt: Number(v.updatedAt) || Date.now(),
  };
  saveFree();
}
export function isFunfunFreeNow(now = Date.now()) {
  return freeSettings.freeUntil > now && freeSettings.freeFrom <= now;
}

const DENY_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>타자팡팡 · 펀펀 플레이</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1e1b4b;color:#fff;font-family:system-ui,'Noto Sans KR',sans-serif}
.box{max-width:420px;padding:32px;text-align:center;background:#312e81;border-radius:24px;box-shadow:0 10px 40px #0006}
h1{font-size:22px;margin:.3em 0}p{line-height:1.6;color:#e0e7ff}a{display:inline-block;margin-top:14px;padding:12px 22px;border-radius:14px;background:#facc15;color:#1e1b4b;font-weight:900;text-decoration:none}</style></head>
<body><div class="box"><div style="font-size:48px">🔒</div><h1>펀펀 플레이는 여기서 바로 열 수 없어요</h1>
<p>타자팡팡에 <b>로그인</b>한 뒤<br><b>놀이터 → 펀펀 플레이</b>에서 포인트를 내고 입장해 주세요.</p>
<a href="/?mode=playground" target="_top">타자팡팡으로 가기</a></div></body></html>`;

/**
 * 반드시 게임 파일(static) 을 내보내는 코드보다 먼저 등록
 * @param dataDir 서버 data 폴더 (비밀키 보관)
 */
export function registerFunfunGate(app: Express, dataDir: string, isMaster: (req: Request) => boolean) {
  loadSecret(dataDir);
  settingsFile = path.join(dataDir, 'funfun-free.json');
  try {
    if (fs.existsSync(settingsFile)) freeSettings = { ...freeSettings, ...JSON.parse(fs.readFileSync(settingsFile, 'utf-8')) };
  } catch {}

  // 무료 개방 상태 (누구나 확인)
  app.get('/api/funfun/free', (_req, res) => {
    res.json({ success: true, ...getFunfunFree(), active: isFunfunFreeNow(), now: Date.now() });
  });
  // 무료 개방 기간 정하기 (선생님만)
  app.post('/api/funfun/free', (req, res) => {
    if (!isMaster(req)) return res.status(403).json({ success: false, message: '선생님(마스터)만 바꿀 수 있어요.' });
    const b = req.body || {};
    if (b.off) setFunfunFree({ freeFrom: 0, freeUntil: 0, note: '' });
    else {
      const from = Number(b.freeFrom) || Date.now();
      const until = Number(b.freeUntil) || 0;
      if (!(until > from)) return res.status(400).json({ success: false, message: '끝나는 시각이 시작 시각보다 뒤여야 해요.' });
      if (until - from > 31 * 24 * 3600 * 1000) return res.status(400).json({ success: false, message: '한 번에 최대 31일까지 열 수 있어요.' });
      setFunfunFree({ freeFrom: from, freeUntil: until, note: b.note });
    }
    res.json({ success: true, ...getFunfunFree(), active: isFunfunFreeNow() });
  });

  // 게임 입장권 받기: 로그인 확인표가 있어야 하고, 남은 이용 시간만큼만 유효
  app.post('/api/funfun/pass', (req, res) => {
    const login = readLogin(req);
    if (!login) return res.status(401).json({ success: false, needLogin: true, message: '로그인이 필요해요. 다시 로그인해 주세요.' });
    const seconds = Math.max(60, Math.min(3 * 3600, Number(req.body?.seconds) || 0));
    let ttl = login.role === 'master' ? 12 * 3600 * 1000 : (seconds + 60) * 1000;
    // 무료 개방 중이면 개방이 끝날 때까지(최대 12시간) 입장권
    if (isFunfunFreeNow()) ttl = Math.max(ttl, Math.min(12 * 3600 * 1000, freeSettings.freeUntil - Date.now() + 60 * 1000));
    res.cookie(FUN_COOKIE, sign({ uid: login.uid, exp: Date.now() + ttl }), cookieOpts(req, ttl));
    res.json({ success: true, expiresInSec: Math.round(ttl / 1000) });
  });

  // 게임을 그만두거나 시간이 끝나면 입장권 회수
  app.post('/api/funfun/leave', (req, res) => {
    res.clearCookie(FUN_COOKIE, { path: '/' });
    res.json({ success: true });
  });

  // 로그아웃: 확인표·입장권 모두 지움
  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
    res.clearCookie(FUN_COOKIE, { path: '/' });
    res.json({ success: true });
  });

  // /games/... 는 로그인 + 입장권이 있어야 열림
  app.use('/games', (req: Request, res: Response, next: NextFunction) => {
    const login = readLogin(req);
    if (login && login.role === 'master') return next();
    if (login && isFunfunFreeNow()) return next(); // 무료 개방 중: 로그인만 하면 입장
    const pass = verify(readCookies(req)[FUN_COOKIE]);
    if (login && pass && pass.uid === login.uid) return next();
    res.status(403);
    if ((req.headers.accept || '').includes('text/html') || /\.html?$|\/$/.test(req.path)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(DENY_HTML);
    }
    return res.end();
  });
}
