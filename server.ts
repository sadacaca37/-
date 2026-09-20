import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { MemberStore, digitsOf } from './server/memberStore';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('etag', 'strong');
// gzip: 첫 화면 JS/CSS 전송량을 1/4 수준으로 줄여 30명이 동시에 접속해도 빠르게 열림
app.use(compression({ threshold: 1024 }));
app.use(express.json({ limit: '2mb' }));

// =========================================================================
// DATA
// =========================================================================
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/** members.json = 코드와 함께 고정되는 회원 명단, data/members-live.json = 실행 중 최신 상태 */
const members = new MemberStore(path.join(ROOT, 'members.json'), path.join(DATA_DIR, 'members-live.json'));

const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const RESET_META_FILE = path.join(DATA_DIR, 'leaderboard_reset_meta.json');
let leaderboardCache: any[] = [];
let lastLeaderboardMonth = '';
try {
  if (fs.existsSync(LEADERBOARD_FILE)) leaderboardCache = JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf-8'));
  if (!Array.isArray(leaderboardCache)) leaderboardCache = [];
} catch {
  leaderboardCache = [];
}
try {
  if (fs.existsSync(RESET_META_FILE)) lastLeaderboardMonth = JSON.parse(fs.readFileSync(RESET_META_FILE, 'utf-8')).lastMonth || '';
} catch {}

// 여러 명이 동시에 기록을 올려도 파일 쓰기는 0.5초에 한 번으로 모아서 처리
let lbTimer: NodeJS.Timeout | null = null;
function persistLeaderboard(sync = false) {
  const write = () => {
    const tmp = `${LEADERBOARD_FILE}.tmp`;
    try {
      fs.writeFileSync(tmp, JSON.stringify(leaderboardCache), 'utf-8');
      fs.renameSync(tmp, LEADERBOARD_FILE);
    } catch (e) {
      console.error('[leaderboard] 저장 실패', e);
    }
  };
  if (sync) return write();
  if (lbTimer) return;
  lbTimer = setTimeout(() => {
    lbTimer = null;
    write();
  }, 500);
}

function checkMonthlyLeaderboardReset() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (currentMonth === lastLeaderboardMonth) return;
  if (lastLeaderboardMonth) {
    console.log(`[Leaderboard] Monthly reset ${lastLeaderboardMonth} -> ${currentMonth}`);
    leaderboardCache = [];
    persistLeaderboard();
  }
  lastLeaderboardMonth = currentMonth;
  try {
    fs.writeFileSync(RESET_META_FILE, JSON.stringify({ lastMonth: currentMonth, resetAt: Date.now() }), 'utf-8');
  } catch {}
}

// =========================================================================
// HELPERS
// =========================================================================
const isMaster = (req: express.Request) => members.checkMaster(String(req.headers['x-master-key'] || ''));
const denyMaster = (res: express.Response) =>
  res.status(403).json({ success: false, message: '마스터(선생님)만 할 수 있어요. 마스터 관리실에서 다시 로그인해 주세요.' });

/** 아주 단순한 요청 제한: 같은 IP에서 1분에 너무 많은 로그인/가입 시도를 막음 (교실은 30명이 IP 하나를 같이 쓰므로 넉넉하게) */
const hits = new Map<string, { n: number; t: number }>();
const limit = (max: number) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const key = `${req.ip}|${req.path}`;
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.t > 60_000) hits.set(key, { n: 1, t: now });
  else if (++h.n > max) return res.status(429).json({ success: false, message: '잠시 후 다시 시도해 주세요.' });
  next();
};
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now - v.t > 60_000) hits.delete(k);
}, 60_000).unref();

// =========================================================================
// API
// =========================================================================
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', usersCount: members.members.length, time: Date.now() });
});

// 명단 조회: 마스터에게는 관리용 전체 정보(전화번호는 가려진 형태), 그 외에는 이름·아바타만
app.get('/api/users', (req, res) => {
  const full = isMaster(req);
  res.json({ success: true, users: members.list(full), master: full });
});

// 학생 로그인
app.post('/api/users/login', limit(300), (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !String(password || '').trim()) {
    return res.status(400).json({ success: false, message: '이름(또는 부모님 전화번호)과 비밀번호를 입력해 주세요.' });
  }
  const r = members.findForLogin(identifier, password);
  if (!r.member) {
    return r.reason === 'password'
      ? res.status(401).json({ success: false, message: '비밀번호가 맞지 않아요. (기본: 부모님 전화번호 뒷 4자리)' })
      : res.status(404).json({ success: false, message: `'${String(identifier).trim()}' 학생을 찾을 수 없어요. 선생님께 등록을 요청해 주세요.` });
  }
  if (!r.member.isApproved) {
    return res.status(403).json({
      success: false,
      pending: true,
      message: `'${r.member.name}' 학생은 선생님 승인 대기 중이에요. 승인되면 바로 로그인할 수 있어요.`,
    });
  }
  members.touchLogin(r.member);
  res.json({ success: true, user: members.toClient(r.member, false) });
});

// 마스터 로그인 확인
app.post('/api/master/login', limit(30), (req, res) => {
  const ok = members.checkMaster(req.body?.password);
  if (!ok) return res.status(401).json({ success: false, message: '마스터 비밀번호가 올바르지 않습니다.' });
  res.json({ success: true, status: members.status() });
});

// 마스터 비밀번호 변경 (명단 고정 파일에 해시로 함께 저장됨)
app.post('/api/master/password', (req, res) => {
  if (!isMaster(req)) return denyMaster(res);
  const pw = String(req.body?.password || '').trim();
  if (pw.length < 4) return res.status(400).json({ success: false, message: '비밀번호는 4자리 이상이어야 합니다.' });
  if (process.env.MASTER_PASSWORD) {
    return res.status(400).json({ success: false, message: '서버 환경변수(MASTER_PASSWORD)로 고정되어 있어 여기서 바꿀 수 없어요.' });
  }
  members.setMasterPassword(pw);
  res.json({ success: true, status: members.status() });
});

// 명단 상태 (고정 안 된 변경 수 등)
app.get('/api/members/status', (req, res) => {
  if (!isMaster(req)) return denyMaster(res);
  res.json({ success: true, status: members.status() });
});

// 명단 고정 파일(members.json) 내려받기
app.get('/api/members/export', (req, res) => {
  if (!isMaster(req)) return denyMaster(res);
  const data = members.exportFixed();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="members.json"');
  res.send(JSON.stringify(data, null, 2));
});

// 가입: 마스터가 등록하면 바로 승인, 학생이 직접 하면 "가입 신청"(승인 대기)
app.post('/api/users/register', limit(120), (req, res) => {
  const { name, parentPhone, phone, grade, avatar, avatarBg } = req.body || {};
  const d = digitsOf(parentPhone || phone || '');
  if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: '학생 이름을 입력해 주세요.' });
  if (d.length < 8) return res.status(400).json({ success: false, message: '부모님 전화번호를 정확히 입력해 주세요.' });
  const master = isMaster(req);
  if (!master && members.members.filter((m) => !m.isApproved).length >= 300) {
    return res.status(429).json({ success: false, message: '가입 신청이 너무 많아요. 선생님께 문의해 주세요.' });
  }
  const r = members.add({ name: String(name), phone: d, grade, avatar, avatarBg, approved: master });
  const user = members.toClient(r.member, master);
  if (r.existing) {
    return res.json({
      success: true,
      isExisting: true,
      pending: !r.member.isApproved,
      message: r.member.isApproved ? '이미 등록된 학생이에요. 바로 로그인하세요.' : '이미 가입 신청이 되어 있어요. 선생님 승인을 기다려 주세요.',
      user,
    });
  }
  res.json({
    success: true,
    pending: !master,
    message: master
      ? `'${r.member.name}' 학생을 등록했어요. 비밀번호는 전화번호 뒷자리 [${r.member.phoneLast4}]입니다.`
      : `'${r.member.name}' 가입 신청 완료! 선생님이 승인하면 로그인할 수 있어요. (비밀번호: 전화번호 뒷자리 ${r.member.phoneLast4})`,
    user,
  });
});

// 일괄 등록 (엑셀/붙여넣기) - 마스터 전용
app.post('/api/users/batch', (req, res) => {
  if (!isMaster(req)) return denyMaster(res);
  const { students, autoApprove = true } = req.body || {};
  if (!Array.isArray(students) || !students.length) {
    return res.status(400).json({ success: false, message: '등록할 학생 목록이 없습니다.' });
  }
  let added = 0;
  let skipped = 0;
  for (const item of students.slice(0, 500)) {
    const name = String(item.name || item['이름'] || item['성명'] || '').trim();
    const d = digitsOf(item.parentPhone || item.phone || item['부모님 전화번호'] || item['학부모연락처'] || item['전화번호'] || '');
    if (!name || d.length < 4) { skipped++; continue; }
    const r = members.add({ name, phone: d, grade: item.grade || item['학년'], avatar: item.avatar, approved: !!autoApprove });
    if (r.existing) skipped++; else added++;
  }
  res.json({ success: true, addedCount: added, skippedCount: skipped, totalUsers: members.members.length });
});

// 예전 클라이언트의 "브라우저 → 서버 명단 밀어넣기"는 삭제된 학생을 되살리므로 더 이상 받지 않음
app.post('/api/users/sync', (_req, res) => {
  res.json({ success: true, addedCount: 0, users: members.list(false) });
});

// 수정: 마스터는 이름/학년/승인/비밀번호, 본인은 연습 기록·아바타만
app.put('/api/users/:id', (req, res) => {
  const master = isMaster(req);
  const m = members.update(req.params.id, req.body || {}, master);
  if (!m) return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.' });
  res.json({ success: true, user: members.toClient(m, master) });
});

// 삭제: 마스터 전용
app.delete('/api/users/:id', (req, res) => {
  if (!isMaster(req)) return denyMaster(res);
  if (!members.remove(req.params.id)) return res.status(404).json({ success: false, message: '삭제할 학생을 찾을 수 없습니다.' });
  res.json({ success: true, message: '학생 계정이 삭제되었습니다.' });
});

// 명예의 전당
app.get('/api/leaderboard', (_req, res) => {
  checkMonthlyLeaderboardReset();
  res.json({ success: true, leaderboard: leaderboardCache, currentMonth: lastLeaderboardMonth });
});

app.post('/api/leaderboard', (req, res) => {
  checkMonthlyLeaderboardReset();
  const entry = req.body;
  if (!entry || !entry.userName) return res.status(400).json({ success: false, message: '유효한 기록 정보가 없습니다.' });
  leaderboardCache.push({
    ...entry,
    userName: String(entry.userName).slice(0, 30),
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date: entry.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
  });
  leaderboardCache.sort((a, b) => (b.score || 0) - (a.score || 0));
  if (leaderboardCache.length > 100) leaderboardCache.length = 100;
  persistLeaderboard();
  res.json({ success: true, leaderboard: leaderboardCache });
});

app.use('/api', (_req, res) => res.status(404).json({ success: false, message: '없는 API 입니다.' }));

// =========================================================================
// STATIC + START
// =========================================================================
// 게임 파일(public/games 등): 하루 캐시
const publicDir = path.join(ROOT, 'public');
if (fs.existsSync(publicDir)) app.use(express.static(publicDir, { maxAge: '1d', index: false }));

async function startServer() {
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT, 'dist');
    // 미리 압축해 둔 파일(.br/.gz)이 있으면 그대로 보냄 → 동시 접속 시 CPU 부담 없음
    const types: Record<string, string> = { '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
    app.get('/assets/*', (req, res, next) => {
      const ext = path.extname(req.path);
      if (!types[ext]) return next();
      const file = path.join(distPath, req.path);
      if (!file.startsWith(distPath)) return next();
      const accept = String(req.headers['accept-encoding'] || '');
      const enc = /\bbr\b/.test(accept) && fs.existsSync(file + '.br') ? 'br' : /\bgzip\b/.test(accept) && fs.existsSync(file + '.gz') ? 'gzip' : '';
      if (!enc) return next();
      res.setHeader('Content-Type', types[ext]);
      res.setHeader('Content-Encoding', enc);
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.sendFile(file + (enc === 'br' ? '.br' : '.gz'));
    });
    // 해시가 붙은 빌드 파일은 1년 캐시 → 두 번째 접속부터는 거의 즉시 열림
    app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '365d', immutable: true }));
    app.use(express.static(distPath, { maxAge: '1h', index: false }));
    const indexHtml = path.join(distPath, 'index.html');
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Typang server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'dev'})`);
  });
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  // 서버가 내려갈 때(재배포 등) 마지막 변경 내용을 바로 저장
  const shutdown = () => {
    members.flush(true);
    persistLeaderboard(true);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
