import React, { useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import { WoodDialog } from './WoodDialog';
import { UserSession } from '../types';
import { buildTodaySummary, fetchMyReports, MyReport, sendTodayReport } from '../utils/dailyReport';
import { KEY_ROUNDS_PER_SET, lastNDayKeys, modeSetLabel } from '../utils/activityLog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
}

const MODE_NAME: Record<string, string> = { key: '자리', word: '낱말', sent: '짧은 글', long: '긴 글', etc: '지식·명곡' };
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const hm = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 학생: 오늘 연습한 것을 선생님께 보내는 창 */
export const SendReportModal: React.FC<Props> = ({ isOpen, onClose, currentUser }) => {
  const [note, setNote] = useState('');
  const [mine, setMine] = useState<MyReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [tick, setTick] = useState(0);

  const today = useMemo(() => buildTodaySummary(currentUser.id), [currentUser.id, tick, isOpen]);
  const week = useMemo(() => lastNDayKeys(7), [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setMsg('');
    void fetchMyReports(currentUser.id).then(setMine);
    // 연습 창에서 방금 친 것이 반영되도록 창이 열려 있는 동안 다시 계산
    const t = window.setInterval(() => setTick((n) => n + 1), 4000);
    return () => window.clearInterval(t);
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const sent = mine.find((r) => r.day === today.day);
  const changedSinceSent = !!sent && (sent.sets !== today.summary.sets || sent.keys !== today.summary.keys);
  const s = today.summary;

  const handleSend = async () => {
    setBusy(true);
    const r = await sendTodayReport(currentUser, note.trim());
    setBusy(false);
    if (r.success) {
      setMsg('✅ 선생님께 보냈어요! 수고했어요 👏');
      setNote('');
      setMine(await fetchMyReports(currentUser.id));
    } else setMsg(`❌ ${r.message || '보내지 못했어요.'}`);
  };

  return (
    <WoodDialog
      title="오늘 연습, 선생님께 보내기"
      sub="오늘 연습을 다 했으면 보내 주세요. 선생님이 모아서 확인해요."
      icon="📮"
      size="md"
      zIndex={120}
      onClose={onClose}
      testId="send-report-modal"
    >
      <p className="wd-lead">⌨️ 자리 연습은 같은 자리를 {KEY_ROUNDS_PER_SET}번 = 1세트 · 다른 연습은 1번 끝내면 1세트</p>

      <div className="wd-stats">
        <Cell label="끝낸 세트" value={`${s.sets}세트`} />
        <Cell label="친 글자 수" value={`${s.keys.toLocaleString()}타`} />
        <Cell label="연습 시간" value={`${s.minutes}분`} />
        <Cell label="평균 타수" value={s.rounds || s.sets ? `${s.avgCpm}타` : '-'} />
        <Cell label="정확도" value={s.rounds || s.sets ? `${s.avgAcc}%` : '-'} />
        <Cell label="전체 진도" value={`${s.questPercent}%`} />
      </div>

      {Object.values(s.byMode).some((c) => c > 0) && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(s.byMode)
            .filter(([, c]) => c > 0)
            .map(([m, c]) => (
              <span key={m} className="wd-chip">
                {(m === 'key' ? (s.keySets || 0) > 0 : c > 0) ? '✅' : '⏳'} {MODE_NAME[m] || m} {modeSetLabel(m, c, s.keySets)}
              </span>
            ))}
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 120))}
        placeholder="선생님께 한마디 (안 써도 돼요)"
        rows={2}
        className="wd-input"
      />

      {/* 완주 확인: 한 세트라도 끝까지 쳐야 보낼 수 있음 */}
      <div className={`wd-note ${s.sets > 0 ? 'wd-note--ok' : 'wd-note--warn'}`} data-testid="finish-check">
        {s.sets > 0 ? (
          <>🏁 <b>완주했어요!</b> 오늘 끝까지 친 세트 {s.sets}개</>
        ) : today.active ? (
          <>⏳ <b>아직 완주 안 했어요.</b> 치다 만 연습이 있어요. 한 세트를 끝까지 쳐야 보낼 수 있어요.</>
        ) : (
          <>⬜ <b>아직 완주 안 했어요.</b> 오늘 친 타자가 없어요. 한 세트를 끝까지 치고 보내 주세요.</>
        )}
      </div>

      {s.sets < 1 ? (
        <button type="button" disabled className="wd-btn wd-btn--block wd-btn--big wd-btn--sky opacity-50 cursor-not-allowed" data-testid="send-report-btn">
          <Send className="w-6 h-6" />
          완주하면 보낼 수 있어요
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          disabled={busy || (!!sent && !changedSinceSent && !note.trim())}
          data-testid="send-report-btn"
          className="wd-btn wd-btn--block wd-btn--big wd-btn--sky"
        >
          <Send className="w-6 h-6" />
          {busy ? '보내는 중…' : !sent ? '선생님께 보내기' : changedSinceSent || note.trim() ? '더 연습한 것 다시 보내기' : `오늘 보냈어요 (${hm(sent.sentAt)})`}
        </button>
      )}

      {msg && <div className={`wd-note ${msg.startsWith('✅') ? 'wd-note--ok' : 'wd-note--warn'}`}>{msg}</div>}
      {sent && !msg && <div className="wd-note">{sent.checkedAt ? '💮 선생님이 확인했어요!' : '선생님이 아직 확인하지 않았어요.'}</div>}

      <div>
        <div className="wd-small mb-1.5">최근 7일</div>
        <div className="wd-week">
          {week.map((k) => {
            const r = mine.find((x) => x.day === k);
            const d = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
            return (
              <div key={k} className={`wd-day ${r ? (r.checkedAt ? 'is-checked' : 'is-sent') : ''}`}>
                <small>
                  {d.getDate()}({WEEK[d.getDay()]})
                </small>
                <b>{r ? (r.checkedAt ? '💮' : '📮') : '·'}</b>
              </div>
            );
          })}
        </div>
        <div className="wd-small mt-1.5">📮 보냄 · 💮 선생님 확인</div>
      </div>
    </WoodDialog>
  );
};

const Cell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="wd-stat">
    <span className="wd-stat-label">{label}</span>
    <span className="wd-stat-val">{value}</span>
  </div>
);
