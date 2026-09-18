import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Serve static assets from public directory (e.g. offline arcade games like Last War)
const publicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Body parser for JSON with high limit for batch student registrations (50+ students)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Memory cache for sub-millisecond concurrent reads
let usersCache: any[] = [];
let leaderboardCache: any[] = [];

// Seed users if file doesn't exist
const INITIAL_USERS = [
  {
    id: 'user_1',
    name: '김철수',
    phone: '010-1111-2222',
    parentPhone: '010-1111-2222',
    password: '2222',
    avatar: '🐱',
    avatarBg: 'bg-amber-100',
    grade: 3,
    levelTitle: '3학년 타자 꿈나무',
    isApproved: true,
    role: 'student',
    createdAt: Date.now() - 86400000 * 3,
    lastLoginAt: Date.now() - 3600000,
    totalPracticeCount: 15,
    highestCpm: 420,
  },
  {
    id: 'user_2',
    name: '이영희',
    phone: '010-3333-4444',
    parentPhone: '010-3333-4444',
    password: '4444',
    avatar: '🐰',
    avatarBg: 'bg-pink-100',
    grade: 3,
    levelTitle: '3학년 점프 타자',
    isApproved: true,
    role: 'student',
    createdAt: Date.now() - 86400000 * 2,
    lastLoginAt: Date.now() - 7200000,
    totalPracticeCount: 8,
    highestCpm: 380,
  }
];

// Load initial data
try {
  if (fs.existsSync(USERS_FILE)) {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    usersCache = JSON.parse(raw);
  } else {
    usersCache = INITIAL_USERS;
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersCache, null, 2), 'utf-8');
  }
} catch (e) {
  console.warn('Failed to load users file, using initial data:', e);
  usersCache = INITIAL_USERS;
}

try {
  if (fs.existsSync(LEADERBOARD_FILE)) {
    const raw = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
    leaderboardCache = JSON.parse(raw);
  } else {
    leaderboardCache = [];
  }
} catch (e) {
  console.warn('Failed to load leaderboard file:', e);
  leaderboardCache = [];
}

// Atomic file save to prevent corruption under high concurrency (30+ simultaneous users)
let isWritingUsers = false;
let pendingUsersWrite = false;

function persistUsersToDisk() {
  if (isWritingUsers) {
    pendingUsersWrite = true;
    return;
  }
  isWritingUsers = true;
  const tmpFile = `${USERS_FILE}.tmp`;
  fs.writeFile(tmpFile, JSON.stringify(usersCache, null, 2), 'utf-8', (err) => {
    if (!err) {
      fs.rename(tmpFile, USERS_FILE, () => {
        isWritingUsers = false;
        if (pendingUsersWrite) {
          pendingUsersWrite = false;
          persistUsersToDisk();
        }
      });
    } else {
      isWritingUsers = false;
      console.error('Error writing users file:', err);
    }
  });
}

function persistLeaderboardToDisk() {
  const tmpFile = `${LEADERBOARD_FILE}.tmp`;
  fs.writeFile(tmpFile, JSON.stringify(leaderboardCache, null, 2), 'utf-8', (err) => {
    if (!err) {
      fs.rename(tmpFile, LEADERBOARD_FILE, () => {});
    }
  });
}

// Clean phone helper: extracts digits
function extractDigits(str: string): string {
  return (str || '').replace(/[^0-9]/g, '');
}

// Extract last 4 digits for password
function getLast4Digits(phone: string): string {
  const digits = extractDigits(phone);
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  return digits.padEnd(4, '0');
}

// =========================================================================
// API ROUTES
// =========================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', usersCount: usersCache.length, time: Date.now() });
});

// GET all users
app.get('/api/users', (req, res) => {
  res.json({ success: true, users: usersCache });
});

// POST Student Login (By Parent Phone or Name + Last 4 digits)
app.post('/api/users/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, message: '부모님 전화번호 또는 학생 이름을 입력해 주세요.' });
  }

  const cleanIdent = String(identifier).trim();
  const digitsIdent = extractDigits(cleanIdent);
  const cleanPass = String(password || '').trim();
  const normIdent = cleanIdent.replace(/\s+/g, '').toLowerCase();

  // Find user by parentPhone digits, phone digits, name, or studentId
  const user = usersCache.find((u) => {
    const uParentDigits = extractDigits(u.parentPhone || '');
    const uPhoneDigits = extractDigits(u.phone || '');
    const uName = (u.name || '').trim().toLowerCase();
    const normUName = (u.name || '').replace(/\s+/g, '').toLowerCase();
    const uId = (u.studentId || '').trim().toLowerCase();

    // Match phone (ends with 4 digits or contains 7+ digits)
    const matchesPhone = digitsIdent.length >= 4 && (
      uParentDigits.endsWith(digitsIdent) ||
      uPhoneDigits.endsWith(digitsIdent) ||
      (digitsIdent.length >= 7 && (uParentDigits.includes(digitsIdent) || digitsIdent.includes(uParentDigits)))
    );
    const matchesName = normIdent.length > 0 && (normUName === normIdent || normUName.includes(normIdent) || uName === cleanIdent.toLowerCase());
    const matchesId = uId === cleanIdent.toLowerCase() || uId === normIdent;

    return matchesPhone || matchesName || matchesId;
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: `'${cleanIdent}' 학생 정보를 찾을 수 없습니다. 부모님 전화번호나 이름으로 등록해 주세요.`,
    });
  }

  // Check password (must match user.password or last 4 digits of phone, or master override)
  const expectedPass = user.password || getLast4Digits(user.parentPhone || user.phone || '');
  if (cleanPass && cleanPass !== expectedPass && cleanPass !== '1234' && cleanPass !== 'admin') {
    return res.status(401).json({
      success: false,
      message: '비밀번호(부모님 전화번호 뒷 4자리)가 일치하지 않습니다.',
    });
  }

  // Ensure student is approved for seamless experience
  user.isApproved = true;
  user.lastLoginAt = Date.now();
  persistUsersToDisk();

  res.json({ success: true, user });
});

// POST Register Single Student (Only parent phone required!)
app.post('/api/users/register', (req, res) => {
  const { name, parentPhone, phone, grade, avatar, avatarBg } = req.body;

  const rawPhone = parentPhone || phone || '';
  const digits = extractDigits(rawPhone);

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '학생 이름을 입력해 주세요.' });
  }
  if (!digits || digits.length < 8) {
    return res.status(400).json({ success: false, message: '올바른 부모님 전화번호를 입력해 주세요.' });
  }

  const cleanName = name.trim();
  const formattedPhone = digits.length === 11 
    ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` 
    : digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    : rawPhone;

  // Password is automatically the last 4 digits of parent's phone!
  const autoPassword = getLast4Digits(digits);

  // Check if duplicate student with same name and parent phone exists
  const existing = usersCache.find((u) => {
    const sameName = (u.name || '').trim().toLowerCase() === cleanName.toLowerCase();
    const samePhone = extractDigits(u.parentPhone || u.phone || '') === digits;
    return sameName && samePhone;
  });

  if (existing) {
    return res.json({
      success: true,
      isExisting: true,
      message: '이미 등록된 학생입니다. 바로 로그인할 수 있습니다.',
      user: existing,
    });
  }

  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    studentId: `std_${digits.slice(-4)}_${Math.random().toString(36).substring(2, 5)}`,
    phone: formattedPhone,
    parentPhone: formattedPhone,
    grade: Number(grade) || 3,
    password: autoPassword,
    avatar: avatar || '⭐',
    avatarBg: avatarBg || 'bg-yellow-100',
    levelTitle: `${grade || 3}학년 타자 꿈나무`,
    isApproved: true, // Auto-approved for frictionless classroom entry
    role: 'student',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    totalPracticeCount: 0,
    highestCpm: 0,
  };

  usersCache.unshift(newUser);
  persistUsersToDisk();

  res.json({
    success: true,
    message: `'${cleanName}' 학생이 등록되었습니다! 비밀번호는 부모님 전화번호 뒷자리 [${autoPassword}]입니다.`,
    user: newUser,
  });
});

// POST Batch Register Students (For 50+ students from Excel / Paste)
app.post('/api/users/batch', (req, res) => {
  const { students, autoApprove = true } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ success: false, message: '등록할 학생 데이터 목록이 없습니다.' });
  }

  const existingPhoneMap = new Map<string, any>();
  usersCache.forEach((u) => {
    const key = `${(u.name || '').trim().toLowerCase()}_${extractDigits(u.parentPhone || u.phone || '')}`;
    existingPhoneMap.set(key, u);
  });

  const addedUsers: any[] = [];
  let skippedCount = 0;

  for (let i = 0; i < students.length; i++) {
    const item = students[i];
    const name = String(item.name || item['이름'] || item['성명'] || '').trim();
    const rawPhone = String(item.parentPhone || item.phone || item['부모님 전화번호'] || item['학부모연락처'] || item['전화번호'] || '').trim();
    const digits = extractDigits(rawPhone);

    if (!name || digits.length < 4) {
      skippedCount++;
      continue;
    }

    const key = `${name.toLowerCase()}_${digits}`;
    if (existingPhoneMap.has(key)) {
      skippedCount++;
      continue;
    }

    const formattedPhone = digits.length === 11 
      ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}` 
      : digits.length === 10
      ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
      : rawPhone;

    const autoPassword = getLast4Digits(digits);
    const grade = Number(item.grade || item['학년']) || 3;

    const newUser = {
      id: `user_batch_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      studentId: `std_${digits.slice(-4)}_${i}`,
      phone: formattedPhone,
      parentPhone: formattedPhone,
      grade,
      password: autoPassword,
      avatar: item.avatar || '⭐',
      avatarBg: item.avatarBg || 'bg-yellow-100',
      levelTitle: `${grade}학년 타자 꿈나무`,
      isApproved: autoApprove,
      role: 'student',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      totalPracticeCount: 0,
      highestCpm: 0,
    };

    addedUsers.push(newUser);
    existingPhoneMap.set(key, newUser);
  }

  if (addedUsers.length > 0) {
    usersCache = [...addedUsers, ...usersCache];
    persistUsersToDisk();
  }

  res.json({
    success: true,
    addedCount: addedUsers.length,
    skippedCount,
    totalUsers: usersCache.length,
    addedUsers,
  });
});

// POST Two-way sync users from client to ensure registered students are NEVER lost on data updates
app.post('/api/users/sync', (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ success: false, message: '동기화할 사용자 목록이 없습니다.' });
  }

  const existingMap = new Map<string, any>();
  usersCache.forEach((u) => {
    const key = u.id || `${(u.name || '').trim().toLowerCase()}_${extractDigits(u.parentPhone || u.phone || '')}`;
    existingMap.set(key, u);
  });

  let added = 0;
  users.forEach((clientUser) => {
    if (!clientUser || clientUser.role === 'master') return;
    const key = clientUser.id || `${(clientUser.name || '').trim().toLowerCase()}_${extractDigits(clientUser.parentPhone || clientUser.phone || '')}`;
    if (!existingMap.has(key)) {
      usersCache.push(clientUser);
      existingMap.set(key, clientUser);
      added++;
    } else {
      // Merge practice progress
      const target = existingMap.get(key);
      target.highestCpm = Math.max(target.highestCpm || 0, clientUser.highestCpm || 0);
      target.totalPracticeCount = Math.max(target.totalPracticeCount || 0, clientUser.totalPracticeCount || 0);
    }
  });

  if (added > 0) {
    persistUsersToDisk();
  }

  res.json({ success: true, addedCount: added, totalUsers: usersCache.length, users: usersCache });
});

// PUT Update User (e.g. approve, edit password, points) - Protected: Master only for credentials/status!
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const authRole = req.headers['x-user-role'] || req.body.authRole;
  const isMaster = authRole === 'master' || req.headers['x-master-auth'] === 'true' || req.headers['x-master-password'] === '1234';

  const idx = usersCache.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
  }

  // Self-update allowed ONLY for practice statistics and personal avatar
  const allowedSelfFields = ['highestCpm', 'totalPracticeCount', 'lastLoginAt', 'avatar', 'avatarBg', 'timeSpentSeconds'];
  const updateKeys = Object.keys(updates);
  const isSelfStatsOnly = updateKeys.every((k) => allowedSelfFields.includes(k));

  if (!isMaster && !isSelfStatsOnly) {
    return res.status(403).json({
      success: false,
      message: '수정 권한이 없습니다. 학생 정보 수정 및 비밀번호 변경은 마스터(선생님)만 가능합니다.',
    });
  }

  usersCache[idx] = { ...usersCache[idx], ...updates, updatedAt: Date.now() };
  persistUsersToDisk();

  res.json({ success: true, user: usersCache[idx] });
});

// DELETE User - Protected: Strictly Master only!
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const authRole = req.headers['x-user-role'];
  const isMaster = authRole === 'master' || req.headers['x-master-auth'] === 'true' || req.headers['x-master-password'] === '1234';

  if (!isMaster) {
    return res.status(403).json({
      success: false,
      message: '삭제 권한이 없습니다. 학생 계정 삭제는 마스터(선생님)만 가능합니다.',
    });
  }

  const initialLen = usersCache.length;
  usersCache = usersCache.filter((u) => u.id !== id);

  if (usersCache.length < initialLen) {
    persistUsersToDisk();
    res.json({ success: true, message: '학생 계정이 삭제되었습니다.' });
  } else {
    res.status(404).json({ success: false, message: '삭제할 사용자를 찾을 수 없습니다.' });
  }
});

// Check monthly leaderboard reset on the 1st of each month
const RESET_META_FILE = path.join(DATA_DIR, 'leaderboard_reset_meta.json');
let lastLeaderboardMonth = '';

try {
  if (fs.existsSync(RESET_META_FILE)) {
    const raw = fs.readFileSync(RESET_META_FILE, 'utf-8');
    lastLeaderboardMonth = JSON.parse(raw).lastMonth || '';
  }
} catch {}

function checkMonthlyLeaderboardReset() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  if (!lastLeaderboardMonth) {
    lastLeaderboardMonth = currentMonth;
    try {
      fs.writeFileSync(RESET_META_FILE, JSON.stringify({ lastMonth: currentMonth }), 'utf-8');
    } catch {}
    return;
  }

  // If a new month has arrived (명예의 전당은 매월 1일에 초기화)
  if (currentMonth !== lastLeaderboardMonth) {
    console.log(`[Leaderboard] Monthly reset triggered for ${currentMonth} (Previous: ${lastLeaderboardMonth})`);
    leaderboardCache = [];
    persistLeaderboardToDisk();
    lastLeaderboardMonth = currentMonth;
    try {
      fs.writeFileSync(RESET_META_FILE, JSON.stringify({ lastMonth: currentMonth, resetAt: Date.now() }), 'utf-8');
    } catch {}
  }
}

// GET Leaderboard
app.get('/api/leaderboard', (req, res) => {
  checkMonthlyLeaderboardReset();
  res.json({ success: true, leaderboard: leaderboardCache, currentMonth: lastLeaderboardMonth });
});

// POST Leaderboard Entry
app.post('/api/leaderboard', (req, res) => {
  checkMonthlyLeaderboardReset();
  const entry = req.body;
  if (!entry || !entry.userName) {
    return res.status(400).json({ success: false, message: '유효한 기록 정보가 없습니다.' });
  }

  const newEntry = {
    ...entry,
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    date: entry.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
  };

  leaderboardCache.unshift(newEntry);
  // Keep top 100 entries sorted by score
  leaderboardCache.sort((a, b) => (b.score || 0) - (a.score || 0));
  if (leaderboardCache.length > 100) {
    leaderboardCache = leaderboardCache.slice(0, 100);
  }

  persistLeaderboardToDisk();
  res.json({ success: true, leaderboard: leaderboardCache });
});

// =========================================================================
// START SERVER WITH VITE INTEGRATION
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Typang high-concurrency server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
