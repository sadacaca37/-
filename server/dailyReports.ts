/**
 * 오늘의 연습 보고 (학생 → 선생님)
 *  - 학생이 연습을 마치고 [선생님께 보내기]를 누르면 그날의 연습 요약이 여기에 쌓임 (학생·날짜마다 1건, 다시 보내면 고쳐 씀)
 *  - 선생님은 마스터 관리실 '받은 보고' 창에서 날짜별로 모아 보고 [확인] 표시를 함 → 매일 들어오지 않아도 나중에 한 번에 확인
 *  - data/daily-reports.json 에 저장, 전체 백업에도 포함
 */
import fs from 'fs';
import path from 'path';
import type { Express, Request } from 'express';

export interface DailyReport {
  id: string; // `${userId}_${day}`
  userId: string;
  name: string;
  grade: number;
  /** 학생 컴퓨터 기준 날짜 YYYY-MM-DD */
  day: string;
  sentAt: number;
  /** 선생님이 확인한 시각 (0 = 아직) */
  checkedAt: number;
  note: string;
  summary: {
    sets: number;
    keys: number;
    minutes: number;
    avgCpm: number;
    bestCpm: number;
    avgAcc: number;
    byMode: Record<string, number>;
    questPercent: number;
    quest: Record<string, [number, number]>;
  };
}

const KEEP_DAYS = 400;
let reports: Record<string, DailyReport> = {};
let file = '';
let timer: NodeJS.Timeout | null = null;

function persist(now = false) {
  const write = () => {
    timer = null;
    if (!file) return;
    try {
      const tmp = file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(Object.values(reports)), 'utf-8');
      fs.renameSync(tmp, file);
    } catch (e) {
      console.error('[reports] 저장 실패', e);
    }
  };
  if (now) {
    if (timer) clearTimeout(timer);
    write();
  } else if (!timer) timer = setTimeout(write, 1500);
}

const int = (v: any, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

function clean(raw: any): DailyReport['summary'] {
  const s = raw || {};
  const byMode: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.byMode || {}).slice(0, 8)) byMode[String(k).slice(0, 12)] = int(v, 9999);
  const quest: Record<string, [number, number]> = {};
  for (const [k, v] of Object.entries<any>(s.quest || {}).slice(0, 6)) quest[String(k).slice(0, 24)] = [int(v?.[0], 999), int(v?.[1], 999)];
  return {
    sets: int(s.sets, 9999),
    keys: int(s.keys, 9999999),
    minutes: int(s.minutes, 1440),
    avgCpm: int(s.avgCpm, 2000),
    bestCpm: int(s.bestCpm, 2000),
    avgAcc: Math.max(0, Math.min(100, Math.round((Number(s.avgAcc) || 0) * 10) / 10)),
    byMode,
    questPercent: int(s.questPercent, 100),
    quest,
  };
}

function prune() {
  const limit = Date.now() - KEEP_DAYS * 86400000;
  for (const [id, r] of Object.entries(reports)) if ((r.sentAt || 0) < limit) delete reports[id];
}

export function getDailyReports(): DailyReport[] {
  return Object.values(reports);
}

/** 백업에서 되살리기: 없는 것은 추가, 같은 보고는 더 나중에 보낸 것·확인 표시를 살림 */
export function mergeDailyReports(list: any) {
  if (!Array.isArray(list)) return 0;
  let n = 0;
  for (const r of list) {
    if (!r || !r.id || !r.userId || !r.day) continue;
    const prev = reports[r.id];
    if (!prev || (prev.sentAt || 0) < (r.sentAt || 0)) {
      reports[r.id] = { ...r, checkedAt: Math.max(prev?.checkedAt || 0, r.checkedAt || 0) };
      n++;
    } else if ((r.checkedAt || 0) > (prev.checkedAt || 0)) prev.checkedAt = r.checkedAt;
  }
  if (n) persist(true);
  return n;
}

export function registerDailyReports(
  app: Express,
  dataDir: string,
  isMaster: (req: Request) => boolean,
  findStudent: (id: string) => { name: string; grade: number } | null,
) {
  file = path.join(dataDir, 'daily-reports.json');
  try {
    if (fs.existsSync(file)) {
      const list = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (Array.isArray(list)) for (const r of list) if (r?.id) reports[r.id] = r;
    }
  } catch {
    reports = {};
  }

  // 학생: 오늘의 연습 보내기
  app.post('/api/reports', (req, res) => {
    const b = req.body || {};
    const userId = String(b.userId || '');
    const day = String(b.day || '');
    const who = findStudent(userId);
    if (!who) return res.status(400).json({ success: false, message: '로그인한 학생만 보낼 수 있어요. 다시 로그인해 주세요.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return res.status(400).json({ success: false, message: '날짜가 올바르지 않아요.' });
    // 오늘·어제 것만 받음 (서버와 학생 컴퓨터의 시간대 차이를 넉넉히 봐줌)
    const diff = Math.abs(Date.now() - new Date(`${day}T12:00:00`).getTime());
    if (diff > 2.5 * 86400000) return res.status(400).json({ success: false, message: '오늘 연습만 보낼 수 있어요.' });
    const summary = clean(b.summary);
    if (summary.sets <= 0 && summary.keys < 30) return res.status(400).json({ success: false, message: '오늘 친 타자가 아직 없어요. 연습을 하고 나서 보내 주세요.' });
    const id = `${userId}_${day}`;
    const prev = reports[id];
    const changed = !prev || prev.summary.sets !== summary.sets || prev.summary.keys !== summary.keys;
    reports[id] = {
      id,
      userId,
      name: who.name,
      grade: who.grade,
      day,
      sentAt: Date.now(),
      // 확인한 뒤에 더 연습해서 다시 보내면 '새 보고'로 다시 보이게 함
      checkedAt: prev && !changed ? prev.checkedAt : 0,
      note: String(b.note || '').slice(0, 120),
      summary,
    };
    prune();
    persist();
    res.json({ success: true, report: reports[id] });
  });

  // 학생 컴퓨터에 남아 있는 '보낸 보고'를 다시 올림 (서버가 빈 상태로 다시 켜졌을 때 되살리기)
  //  - 이미 있는 보고는 더 나중 것만, 선생님 확인 표시는 남김
  app.post('/api/reports/sync', (req, res) => {
    const list: any[] = Array.isArray(req.body?.reports) ? req.body.reports.slice(0, 40) : [];
    const now = Date.now();
    const oldest = now - KEEP_DAYS * 86400000;
    let added = 0;
    for (const raw of list) {
      const userId = String(raw?.userId || '');
      const day = String(raw?.day || '');
      const who = findStudent(userId);
      if (!who || !/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      const sentAt = Math.min(now, Number(raw.sentAt) || 0);
      if (sentAt < oldest) continue;
      const id = `${userId}_${day}`;
      const prev = reports[id];
      if (prev && prev.sentAt >= sentAt) continue;
      reports[id] = {
        id,
        userId,
        name: who.name,
        grade: who.grade,
        day,
        sentAt,
        checkedAt: Math.max(prev?.checkedAt || 0, Math.min(now, Number(raw.checkedAt) || 0)),
        note: String(raw.note || '').slice(0, 120),
        summary: clean(raw.summary),
      };
      added++;
    }
    if (added) persist();
    res.json({ success: true, added });
  });

  // 학생: 내가 보낸 보고 (최근 14일) — 보냈는지, 선생님이 확인했는지
  app.get('/api/reports/mine', (req, res) => {
    const userId = String(req.query.userId || '');
    const limit = Date.now() - 14 * 86400000;
    const list = Object.values(reports)
      .filter((r) => r.userId === userId && r.sentAt >= limit)
      .map((r) => ({ day: r.day, sentAt: r.sentAt, checkedAt: r.checkedAt, sets: r.summary.sets, keys: r.summary.keys }));
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, reports: list });
  });

  // 선생님: 받은 보고 모아 보기
  app.get('/api/reports', (req, res) => {
    if (!isMaster(req)) return res.status(403).json({ success: false, message: '선생님(마스터)만 볼 수 있어요. 마스터 관리실에서 다시 로그인해 주세요.' });
    const days = Math.max(1, Math.min(KEEP_DAYS, Number(req.query.days) || 62));
    const limit = Date.now() - days * 86400000;
    const list = Object.values(reports)
      .filter((r) => r.sentAt >= limit)
      .sort((a, b) => b.sentAt - a.sentAt);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, reports: list, unchecked: Object.values(reports).filter((r) => !r.checkedAt).length, now: Date.now() });
  });

  // 선생님: 새 보고 수만 (관리실 버튼의 숫자 표시용)
  app.get('/api/reports/count', (req, res) => {
    if (!isMaster(req)) return res.status(403).json({ success: false });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, unchecked: Object.values(reports).filter((r) => !r.checkedAt).length });
  });

  // 선생님: 확인 표시 (ids 또는 all)
  app.post('/api/reports/check', (req, res) => {
    if (!isMaster(req)) return res.status(403).json({ success: false, message: '선생님(마스터)만 할 수 있어요.' });
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const on = req.body?.checked !== false;
    const targets = req.body?.all ? Object.values(reports).filter((r) => !r.checkedAt) : ids.map((id) => reports[id]).filter(Boolean);
    for (const r of targets) r.checkedAt = on ? Date.now() : 0;
    if (targets.length) persist();
    res.json({ success: true, changed: targets.length, unchecked: Object.values(reports).filter((r) => !r.checkedAt).length });
  });
}
