/**
 * 타팡 의견함 (화면 오른쪽 아래에 늘 떠 있는 타팡)
 *  - 학생: 타팡을 누르면 채팅 창 → 게임·타자 연습에서 불편한 점, 바라는 점을 써서 보내면 선생님께 감
 *          "선생님이 모아서 보고 일주일에 한 번씩 고쳐 줘요" 안내
 *  - 선생님: 같은 타팡을 누르면 '받은 의견함' → 확인·고쳤어요 표시, 답장, 지우기, 모두 복사(Claude에게 붙여 넣기)
 *  - 스크롤하면 살짝 늦게 따라오며 통통 튐 (늘 화면 오른쪽 아래)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppMode, UserSession } from '../types';
import { TvBot } from './views/TapangHome';
import { isTeacherUser } from '../utils/moaFirebase';
import { soundManager } from '../utils/sound';
import {
  CAT_LABEL,
  FeedbackCat,
  FeedbackMsg,
  FeedbackStatus,
  MyFeedback,
  STATUS_LABEL,
  TEXT_MAX,
  canSendFeedback,
  feedbackAsText,
  importFromProgress,
  lastScanAt,
  readMyBox,
  refreshMine,
  removeFeedback,
  sendFeedback,
  setFeedbackReply,
  setFeedbackStatus,
  watchInbox,
} from '../utils/tapangFeedback';

const PAGE_NAME: Partial<Record<AppMode, string>> = {
  home: '첫 화면',
  'key-practice': '자리 연습',
  'word-practice': '낱말 연습',
  'sentence-practice': '짧은 글 연습',
  'long-practice': '긴 글 연습',
  'knowledge-hub': '지식 타자',
  'capital-journey': '지식 타자 · 수도',
  'joseon-journey': '지식 타자 · 조선',
  'lyrics-challenge': '지식 타자 · 노래',
  'python-coding': '지식 타자 · 파이썬',
  'transcription-challenge': '필사',
  'mini-games': '미니타자게임',
  'word-crush': '미니타자게임 · 낱말 부수기',
  'mole-game': '미니타자게임 · 두더지',
  'rain-game': '미니타자게임 · 산성비',
  'shortcut-quiz': '미니타자게임 · 단축키',
  tamagotchi: '다마고치',
  playground: '놀이터',
  leaderboard: '명예의 전당',
};

/** 놀이터에서 마지막으로 연 게임 (PlaygroundHome이 적어 둠) */
export const LAST_GAME_KEY = 'tp_last_game';
function lastGame(): string {
  try {
    const v = JSON.parse(sessionStorage.getItem(LAST_GAME_KEY) || 'null');
    return v && v.title && Date.now() - Number(v.at) < 40 * 60000 ? String(v.title) : '';
  } catch {
    return '';
  }
}

const CATS: FeedbackCat[] = ['game', 'typing', 'bug', 'idea', 'etc'];
const WEEKLY = '선생님이 모아서 보고, 일주일에 한 번씩 고쳐 주셔!';

const clock = (t: number) => {
  const d = new Date(t);
  const today = new Date().toDateString() === d.toDateString();
  const hm = `${d.getHours() < 12 ? '오전' : '오후'} ${((d.getHours() + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, '0')}`;
  return today ? hm : `${d.getMonth() + 1}월 ${d.getDate()}일 ${hm}`;
};

/* 스크롤하면 살짝 늦게 따라오는 움직임 */
function useScrollLag() {
  const [lag, setLag] = useState(0);
  useEffect(() => {
    let last = window.scrollY;
    let t = 0;
    const on = () => {
      const dy = window.scrollY - last;
      last = window.scrollY;
      setLag((v) => Math.max(-22, Math.min(22, v - dy * 0.35)));
      window.clearTimeout(t);
      t = window.setTimeout(() => setLag(0), 110);
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      window.clearTimeout(t);
    };
  }, []);
  return lag;
}

export const TapangHelpBot: React.FC<{ user: UserSession | null; mode: AppMode; onLogin: () => void }> = ({ user, mode, onLogin }) => {
  const isMaster = user?.role === 'master';
  const [open, setOpen] = useState(false);
  const [mini, setMini] = useState(() => {
    try {
      return sessionStorage.getItem('tpb_mini') === '1';
    } catch {
      return false;
    }
  });
  const [tip, setTip] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const lag = useScrollLag();

  // 처음 들어왔을 때 한 번 말풍선으로 안내, 그 뒤로는 5분마다 잠깐
  useEffect(() => {
    let first = 0;
    try {
      if (!sessionStorage.getItem('tpb_tip')) {
        sessionStorage.setItem('tpb_tip', '1');
        first = window.setTimeout(() => setTip(true), 1200);
      }
    } catch {}
    const every = window.setInterval(() => setTip(true), 5 * 60000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, []);
  useEffect(() => {
    if (!tip) return;
    const t = window.setTimeout(() => setTip(false), 9000);
    return () => window.clearTimeout(t);
  }, [tip]);

  const setMiniSaved = (v: boolean) => {
    setMini(v);
    try {
      sessionStorage.setItem('tpb_mini', v ? '1' : '0');
    } catch {}
  };

  const toggle = () => {
    try {
      soundManager.play('pop');
    } catch {}
    setTip(false);
    setOpen((o) => !o);
  };

  const tipText = isMaster
    ? newCount > 0
      ? `새 의견 ${newCount}개가 왔어요!`
      : '학생 의견함'
    : '불편한 점, 고쳤으면 하는 점을 타팡에게 말해 줘! 💬';

  if (mini && !open) {
    return (
      <>
        {isMaster && <TeacherCounter onCount={setNewCount} />}
        <button type="button" className="tpb-mini" onClick={() => setMiniSaved(false)} aria-label="타팡 다시 보이기" data-testid="tapang-mini">
          <TvBot size={34} />
          {isMaster && newCount > 0 && <span className="tpb-badge">{newCount}</span>}
        </button>
      </>
    );
  }

  return (
    <>
      {open && (
        <div className="tpb-panel" role="dialog" aria-label={isMaster ? '받은 의견함' : '타팡 의견함'} data-testid="tapang-panel">
          {isMaster ? <TeacherInbox onClose={() => setOpen(false)} onCount={setNewCount} /> : <StudentChat user={user} mode={mode} onLogin={onLogin} onClose={() => setOpen(false)} />}
        </div>
      )}
      {/* 선생님은 창을 닫아 두어도 새 의견 수를 알 수 있게 */}
      {isMaster && !open && <TeacherCounter onCount={setNewCount} />}
      <div className="tpb-dock" style={{ transform: `translateY(${lag}px)` }}>
        {(tip || (isMaster && newCount > 0)) && !open && (
          <button type="button" className="tpb-tip" onClick={toggle} data-testid="tapang-tip">
            {tipText}
            {!isMaster && <small>{WEEKLY.replace('셔!', '셔요.')}</small>}
          </button>
        )}
        <div className="tpb-hover-tip" aria-hidden="true">
          {isMaster ? '받은 의견함' : '타팡에게 불편한 점 말하기'}
        </div>
        <button
          type="button"
          className={`tpb-launcher ${open ? 'is-open' : ''}`}
          onClick={toggle}
          aria-label={isMaster ? '받은 의견함 열기' : '타팡에게 불편한 점 말하기'}
          data-testid="tapang-bot"
        >
          <span className="tpb-bob">
            <TvBot size={70} />
          </span>
          {isMaster && newCount > 0 && <span className="tpb-badge">{newCount}</span>}
          {!isMaster && !open && <span className="tpb-talk">💬</span>}
        </button>
        {!open && (
          <button type="button" className="tpb-hide" onClick={() => setMiniSaved(true)} aria-label="타팡 작게 숨기기" title="작게 숨기기">
            –
          </button>
        )}
      </div>
    </>
  );
};

/* ================================================================== */
/*  학생: 타팡과 채팅                                                    */
/* ================================================================== */
type Bot = { kind: 'bot'; id: string; text: string; sub?: string };
type Line = Bot | { kind: 'me'; msg: MyFeedback };

const StudentChat: React.FC<{ user: UserSession | null; mode: AppMode; onLogin: () => void; onClose: () => void }> = ({ user, mode, onLogin, onClose }) => {
  const can = canSendFeedback(user);
  const [mine, setMine] = useState<MyFeedback[]>(() => (user ? readMyBox(user.id) : []));
  const [after, setAfter] = useState<Bot[]>([]);
  const [cat, setCat] = useState<FeedbackCat | null>(null);
  const [where, setWhere] = useState(() => lastGame() || PAGE_NAME[mode] || '');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user || !can) return;
    let alive = true;
    refreshMine(user.id).then((l) => alive && setMine(l));
    return () => {
      alive = false;
    };
  }, [user?.id, can]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mine.length, after.length]);

  useEffect(() => {
    if (can) window.setTimeout(() => inputRef.current?.focus(), 150);
  }, [can]);

  const pickCat = (c: FeedbackCat) => {
    setCat(c);
    if (c === 'game') setWhere(lastGame() || (mode === 'playground' ? '' : where));
    else if (c === 'typing') setWhere(PAGE_NAME[mode] && /연습|타자|필사/.test(PAGE_NAME[mode]!) ? PAGE_NAME[mode]! : '');
    inputRef.current?.focus();
  };

  const send = async () => {
    if (!user || busy) return;
    setErr('');
    setBusy(true);
    const r = await sendFeedback(user, { cat: cat || 'etc', text, where });
    setBusy(false);
    if (!r.ok || !r.msg) {
      setErr(r.error || '보내지 못했어. 다시 해 볼래?');
      return;
    }
    try {
      soundManager.play('achievement');
    } catch {}
    setMine(readMyBox(user.id));
    setText('');
    setCat(null);
    setAfter((a) => [
      ...a,
      {
        kind: 'bot',
        id: `${r.msg!.id}_r`,
        text: r.delivered ? '고마워! 선생님께 잘 전달했어 📮' : '고마워! 이 컴퓨터에 먼저 적어 뒀어 📝',
        sub: r.delivered ? WEEKLY : '인터넷이 잠깐 안 돼서 연결되면 선생님께 가. ' + WEEKLY,
      },
    ]);
  };

  const lines: Line[] = useMemo(() => {
    const out: Line[] = [];
    for (const m of mine.slice(-12)) out.push({ kind: 'me', msg: m });
    return [...out, ...after];
  }, [mine, after]);

  return (
    <>
      <div className="tpb-head">
        <TvBot size={38} />
        <div className="tpb-head-text">
          <b>타팡 의견함</b>
          <span>불편한 점 · 바라는 점을 선생님께 전해 줘요</span>
        </div>
        <button type="button" className="tpb-x" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>
      <div className="tpb-body" ref={listRef}>
        <BotSay text="안녕! 나는 타팡이야 📺" />
        <BotSay text="게임을 하거나 타자 연습을 할 때 불편했던 점, 이렇게 고쳐 주면 좋겠다 하는 점을 나한테 말해 줘." />
        <div className="tpb-note" data-testid="tapang-weekly">
          🛠️ <b>선생님이 모아서 확인하고, 일주일에 한 번씩 고쳐 주셔요.</b>
          <span>어디서 · 무엇이 · 어떻게 불편했는지 자세히 쓸수록 빨리 고칠 수 있어요.</span>
        </div>
        {lines.map((l) =>
          l.kind === 'bot' ? (
            <BotSay key={l.id} text={l.text} sub={l.sub} />
          ) : (
            <React.Fragment key={l.msg.id}>
              <div className="tpb-me">
                <div className="tpb-me-bubble">
                  <div className="tpb-me-meta">
                    {CAT_LABEL[l.msg.cat]}
                    {l.msg.where ? ` · ${l.msg.where}` : ''}
                  </div>
                  {l.msg.text}
                </div>
                <div className="tpb-me-st">
                  {clock(l.msg.at)} · {!l.msg.sent ? '⏳ 보내는 중' : l.msg.st === 'fixed' ? '🛠️ 고쳤어요' : l.msg.st === 'seen' ? '👀 선생님이 봤어요' : '📮 전달됨'}
                </div>
              </div>
              {l.msg.reply && <BotSay text={`선생님: ${l.msg.reply}`} teacher />}
            </React.Fragment>
          ),
        )}
      </div>
      {can ? (
        <div className="tpb-compose">
          <div className="tpb-cats" role="group" aria-label="무엇에 대한 이야기인가요">
            {CATS.map((c) => (
              <button key={c} type="button" className={`tpb-chip ${cat === c ? 'on' : ''}`} onClick={() => pickCat(c)}>
                {CAT_LABEL[c]}
              </button>
            ))}
          </div>
          <label className="tpb-where">
            <span>📍 어디에서?</span>
            <input value={where} maxLength={40} onChange={(e) => setWhere(e.target.value)} placeholder="게임 이름이나 화면 (예: 블록 쌓기 월드)" />
          </label>
          <div className="tpb-row">
            <textarea
              ref={inputRef}
              value={text}
              maxLength={TEXT_MAX}
              rows={2}
              placeholder="예) 게임을 닫으면 점수가 사라져요 / 글자가 너무 작아요"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
              data-testid="tapang-input"
            />
            <button type="button" className="tpb-send" disabled={busy || text.trim().length < 2} onClick={() => void send()} data-testid="tapang-send">
              {busy ? '…' : '보내기'}
            </button>
          </div>
          <div className="tpb-foot">
            {err ? <span className="tpb-err">{err}</span> : <span>Enter 보내기 · Shift+Enter 줄 바꾸기</span>}
            <span>
              {text.length}/{TEXT_MAX}
            </span>
          </div>
        </div>
      ) : (
        <div className="tpb-compose tpb-login">
          {user?.role === 'master' ? (
            <span>선생님 계정에서는 받은 의견함이 열려요.</span>
          ) : (
            <>
              <span>로그인하면 누가 보냈는지 선생님이 알 수 있게 보내져요.</span>
              <button type="button" className="tpb-send" onClick={onLogin}>
                로그인하기
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
};

const BotSay: React.FC<{ text: string; sub?: string; teacher?: boolean }> = ({ text, sub, teacher }) => (
  <div className={`tpb-bot ${teacher ? 'is-teacher' : ''}`}>
    <span className="tpb-bot-face" aria-hidden="true">
      {teacher ? '🧑‍🏫' : <TvBot size={26} />}
    </span>
    <div className="tpb-bot-bubble">
      {text}
      {sub && <small>{sub}</small>}
    </div>
  </div>
);

/* ================================================================== */
/*  선생님: 받은 의견함                                                  */
/* ================================================================== */
/** 선생님 Firebase 로그인이 늦게 끝나도 다시 확인 */
function useTeacherAuth(): boolean {
  const [ok, setOk] = useState(isTeacherUser());
  useEffect(() => {
    const on = () => setOk(isTeacherUser());
    window.addEventListener('moa-auth-changed', on);
    on();
    return () => window.removeEventListener('moa-auth-changed', on);
  }, []);
  return ok;
}

const TeacherCounter: React.FC<{ onCount: (n: number) => void }> = ({ onCount }) => {
  const ok = useTeacherAuth();
  useEffect(() => {
    if (!ok) return;
    return watchInbox((l) => onCount(l.filter((m) => m.st === 'new').length), () => {});
  }, [ok, onCount]);
  return null;
};

type Tab = 'new' | 'seen' | 'fixed' | 'all';

const TeacherInbox: React.FC<{ onClose: () => void; onCount: (n: number) => void }> = ({ onClose, onCount }) => {
  const [list, setList] = useState<FeedbackMsg[] | null>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<Tab>('new');
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [scan, setScan] = useState('');
  const [copied, setCopied] = useState(false);
  const known = useRef<Set<string>>(new Set());
  const ok = useTeacherAuth();

  useEffect(() => {
    if (!ok) {
      setErr('선생님 계정(이메일)으로 로그인해야 의견을 볼 수 있어요. 관리실에서 다시 로그인해 주세요.');
      setList([]);
      return;
    }
    setErr('');
    setList(null);
    return watchInbox(
      (l) => {
        setList(l);
        l.forEach((m) => known.current.add(m.id));
        onCount(l.filter((m) => m.st === 'new').length);
      },
      () => {
        setErr('의견함을 불러오지 못했어요. 인터넷을 확인하고 다시 열어 주세요.');
        setList([]);
      },
    );
  }, [ok, onCount]);

  const findMore = useCallback(async () => {
    setScan('학생 기록에서 아직 안 온 의견을 찾는 중…');
    try {
      const n = await importFromProgress(known.current);
      setScan(n ? `학생 기록에서 ${n}개를 더 찾아 넣었어요.` : '더 찾은 의견은 없어요.');
    } catch {
      setScan('학생 기록을 읽지 못했어요.');
    }
    window.setTimeout(() => setScan(''), 6000);
  }, []);

  // 규칙이 없을 때 학생 컴퓨터에만 남은 의견: 몇 시간에 한 번 저절로 찾아옴
  useEffect(() => {
    if (list && !err && Date.now() - lastScanAt() > 3 * 3600000) void findMore();
  }, [list === null, err]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c = { new: 0, seen: 0, fixed: 0, all: 0 } as Record<Tab, number>;
    (list || []).forEach((m) => {
      c[m.st]++;
      c.all++;
    });
    return c;
  }, [list]);
  const shown = (list || []).filter((m) => tab === 'all' || m.st === tab);

  const mark = async (id: string, st: FeedbackStatus) => {
    try {
      await setFeedbackStatus(id, st);
    } catch {
      setErr('바꾸지 못했어요. 다시 해 주세요.');
    }
  };
  const copyAll = async () => {
    const txt = feedbackAsText([...shown].reverse());
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <div className="tpb-head">
        <TvBot size={38} />
        <div className="tpb-head-text">
          <b>받은 의견함</b>
          <span>학생들이 타팡에게 말한 불편한 점 · 바라는 점</span>
        </div>
        <button type="button" className="tpb-x" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>
      <div className="tpb-tabs" role="tablist">
        {(['new', 'seen', 'fixed', 'all'] as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tpb-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t === 'all' ? '모두' : t === 'new' ? '새 의견' : t === 'seen' ? '확인함' : '고쳤어요'} {counts[t]}
          </button>
        ))}
      </div>
      <div className="tpb-tools">
        <button type="button" onClick={() => void copyAll()} disabled={!shown.length} data-testid="tapang-copy">
          {copied ? '✅ 복사했어요' : '📋 이 목록 복사'}
        </button>
        <button type="button" onClick={() => void findMore()} disabled={!!scan && scan.endsWith('…')}>
          🔍 학생 기록에서 찾기
        </button>
      </div>
      {scan && <div className="tpb-scan">{scan}</div>}
      <div className="tpb-body tpb-inbox" data-testid="tapang-inbox">
        {err && <div className="tpb-err-box">{err}</div>}
        {list === null && <div className="tpb-empty">불러오는 중…</div>}
        {list && !shown.length && !err && (
          <div className="tpb-empty">{tab === 'new' ? '새 의견이 없어요. 🎉' : '여기에는 아직 없어요.'}</div>
        )}
        {shown.map((m) => (
          <div key={m.id} className={`tpb-card st-${m.st}`} data-testid="tapang-card">
            <div className="tpb-card-top">
              <b>
                {m.name}
                {m.grade ? ` ${m.grade}학년` : ''}
              </b>
              {m.school && <span className="tpb-school">{m.school}</span>}
              <span className="tpb-when">{clock(m.at)}</span>
            </div>
            <div className="tpb-card-tags">
              <span>{CAT_LABEL[m.cat]}</span>
              {m.where && <span>📍 {m.where}</span>}
              <span className={`tpb-st st-${m.st}`}>{STATUS_LABEL[m.st]}</span>
            </div>
            <div className="tpb-card-text">{m.text}</div>
            {m.reply && <div className="tpb-card-reply">↩️ {m.reply}</div>}
            {replying === m.id ? (
              <div className="tpb-reply-row">
                <input
                  autoFocus
                  value={reply}
                  maxLength={200}
                  placeholder="학생에게 보일 짧은 답 (예: 다음 주에 고칠게요!)"
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing && reply.trim()) {
                      void setFeedbackReply(m.id, reply).catch(() => setErr('답장을 저장하지 못했어요.'));
                      setReplying(null);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!reply.trim()}
                  onClick={() => {
                    void setFeedbackReply(m.id, reply).catch(() => setErr('답장을 저장하지 못했어요.'));
                    setReplying(null);
                  }}
                >
                  저장
                </button>
                <button type="button" onClick={() => setReplying(null)}>
                  취소
                </button>
              </div>
            ) : (
              <div className="tpb-card-acts">
                {m.st !== 'seen' && (
                  <button type="button" onClick={() => void mark(m.id, 'seen')}>
                    👀 확인
                  </button>
                )}
                {m.st !== 'fixed' && (
                  <button type="button" onClick={() => void mark(m.id, 'fixed')}>
                    🛠️ 고쳤어요
                  </button>
                )}
                {m.st !== 'new' && (
                  <button type="button" onClick={() => void mark(m.id, 'new')}>
                    ↺ 새 의견으로
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setReplying(m.id);
                    setReply(m.reply);
                  }}
                >
                  ↩️ 답장
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (window.confirm(`${m.name} 학생의 의견을 지울까요?`)) void removeFeedback(m.id).catch(() => setErr('지우지 못했어요.'));
                  }}
                >
                  🗑
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="tpb-foot tpb-foot--t">학생 화면에는 “선생님이 모아서 보고 일주일에 한 번씩 고쳐 준다”고 안내돼요.</div>
    </>
  );
};
