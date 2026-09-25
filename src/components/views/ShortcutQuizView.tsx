import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, RotateCcw, Zap, Flame, Trophy, Play, ArrowLeft, Keyboard } from 'lucide-react';
import { GAME_POINTS } from '../../utils/pointRules';
import { SHORTCUT_QUIZ_DATA } from '../../data/practiceData';
import { soundManager } from '../../utils/sound';
import { UserSession, LeaderboardEntry, ShortcutQuizItem } from '../../types';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';

/**
 * ⚡ 단축키 디펜스 — 단축키 퀴즈를 아케이드 게임으로
 *
 * 하늘에서 "단축키 몬스터"가 내려옵니다. 몬스터에 적힌 일을 하는 단축키를
 * 땅에 닿기 전에 실제로 눌러서 물리치세요!
 *  - 맞히면 💥 콤보가 올라가고 점수가 배로 붙어요
 *  - 땅에 닿으면 ❤️ 하나를 잃어요 (3개 다 잃으면 게임 끝)
 *  - 웨이브가 올라갈수록 몬스터가 빨라져요
 */

interface ShortcutQuizViewProps {
  currentUser: UserSession | null;
  onRecordScore: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  onBack?: () => void;
}

type Phase = 'ready' | 'play' | 'over' | 'clear';

interface Monster {
  id: number;
  quiz: ShortcutQuizItem;
  face: string;
  x: number; // 0~100 (%)
  bornAt: number;
  fallMs: number; // 땅까지 걸리는 시간
  state: 'fall' | 'boom' | 'hit';
}

const WAVE_SIZE = 8;
const MAX_LIVES = 3;
const MONSTER_FACES = ['👾', '👻', '🤖', '🐙', '🦠', '👹', '🎃', '🧟', '🐲', '🛸'];
const MODIFIERS = ['Control', 'Meta', 'Alt', 'Shift'];

/** 웨이브별 낙하 시간(ms): 1웨이브 9초 → 점점 빨라져 최소 3.5초 */
const fallMsForWave = (wave: number) => Math.max(3500, 9000 - (wave - 1) * 900);

/** 눌린 키 조합이 정답 조합과 같은지 (Ctrl/Cmd/Win 은 서로 같은 것으로 봄) */
function comboMatches(required: string[], pressed: string[]) {
  const norm = (k: string) => {
    const l = k.toLowerCase();
    if (l === 'command' || l === 'cmd' || l === 'win' || l === 'meta') return 'ctrl';
    return l;
  };
  const req = required.map(norm);
  const got = pressed.map(norm);
  if (req.length !== got.length) return false;
  return req.every((k) => got.includes(k));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ShortcutQuizView: React.FC<ShortcutQuizViewProps> = ({ currentUser, onRecordScore, onBack }) => {
  const [phase, setPhase] = useState<Phase>('ready');
  const [deck, setDeck] = useState<ShortcutQuizItem[]>([]);
  const [deckPos, setDeckPos] = useState(0);
  const [monster, setMonster] = useState<Monster | null>(null);
  const [progress, setProgress] = useState(0); // 0~1 (내려온 정도)
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [wave, setWave] = useState(1);
  const [killed, setKilled] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [pressed, setPressed] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string; tone: 'good' | 'bad' | 'wave' } | null>(null);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<'none' | 'hit' | 'boom'>('none');

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const monsterRef = useRef<Monster | null>(null);
  const phaseRef = useRef<Phase>('ready');
  const livesRef = useRef(MAX_LIVES);
  const nextIdRef = useRef(1);
  const pausedAtRef = useRef<number | null>(null);
  monsterRef.current = monster;
  phaseRef.current = phase;
  livesRef.current = lives;

  const total = deck.length;

  const say = (text: string, tone: 'good' | 'bad' | 'wave') => {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 1400);
  };

  const focusGame = useCallback(() => containerRef.current?.focus(), []);
  useEffect(() => {
    focusGame();
  }, [phase, monster?.id, focusGame]);

  /** 다음 몬스터 내려보내기 */
  const spawn = useCallback(
    (pos: number, currentDeck: ShortcutQuizItem[], currentWave: number) => {
      const quiz = currentDeck[pos];
      if (!quiz) return;
      const m: Monster = {
        id: nextIdRef.current++,
        quiz,
        face: MONSTER_FACES[pos % MONSTER_FACES.length],
        x: 18 + Math.random() * 64,
        bornAt: performance.now(),
        fallMs: fallMsForWave(currentWave),
        state: 'fall',
      };
      setMonster(m);
      setProgress(0);
      setPressed([]);
      setHint(null);
    },
    [],
  );

  const startGame = () => {
    const d = shuffle(SHORTCUT_QUIZ_DATA);
    setDeck(d);
    setDeckPos(0);
    setLives(MAX_LIVES);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setWave(1);
    setKilled(0);
    setWrong(0);
    setPhase('play');
    soundManager.play('click');
    spawn(0, d, 1);
  };

  /** 게임 끝 (목숨 0 또는 전부 격파) */
  const finish = useCallback(
    (result: 'over' | 'clear', finalScore: number, finalKilled: number, finalWrong: number, finalMax: number) => {
      setPhase(result);
      setMonster(null);
      if (result === 'clear') {
        soundManager.playVictory();
        try {
          confetti({ particleCount: 160, spread: 90, origin: { y: 0.55 } });
        } catch {}
      } else {
        soundManager.play('error');
      }
      // 한 웨이브 이상 깼으면 게임 포인트 지급
      if (finalKilled >= WAVE_SIZE) {
        addTypingPracticePoints(GAME_POINTS, `단축키 디펜스 (${finalScore.toLocaleString()}점)`);
      }
      dailyMissionsManager.incrementProgress('game', 1, currentUser?.id);
      if (currentUser && finalScore > 0) {
        const attempts = finalKilled + finalWrong;
        onRecordScore({
          userName: currentUser.name,
          userAvatar: currentUser.avatar || '⚡',
          mode: 'shortcut-quiz',
          modeTitle: '단축키 디펜스',
          score: finalScore,
          cpm: 0,
          accuracy: attempts > 0 ? Math.round((finalKilled / attempts) * 100) : 100,
          details: `몬스터 ${finalKilled}마리 격파 · 최고 콤보 ${finalMax}`,
        });
      }
    },
    [currentUser, onRecordScore],
  );

  /** 몬스터가 땅에 닿았을 때 */
  const onLanded = useCallback(() => {
    const m = monsterRef.current;
    if (!m || m.state !== 'fall') return;
    soundManager.playError();
    setMonster({ ...m, state: 'hit' });
    setFlash('hit');
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
    window.setTimeout(() => setFlash('none'), 300);
    setCombo(0);
    setHint(`정답은 ${m.quiz.keysDisplay} 였어요!`);
    say(`💔 놓쳤다! 정답: ${m.quiz.keysDisplay}`, 'bad');
    const nextLives = livesRef.current - 1;
    setLives(nextLives);
    window.setTimeout(() => {
      if (nextLives <= 0) {
        setScore((s) => {
          setKilled((k) => {
            setWrong((w) => {
              setMaxCombo((mc) => {
                finish('over', s, k, w, mc);
                return mc;
              });
              return w;
            });
            return k;
          });
          return s;
        });
        return;
      }
      advance();
    }, 1300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finish]);

  /** 다음 몬스터로 (덱 끝이면 클리어) */
  const advance = useCallback(() => {
    setDeckPos((pos) => {
      const next = pos + 1;
      setDeck((d) => {
        if (next >= d.length) {
          setScore((s) => {
            setKilled((k) => {
              setWrong((w) => {
                setMaxCombo((mc) => {
                  finish('clear', s, k, w, mc);
                  return mc;
                });
                return w;
              });
              return k;
            });
            return s;
          });
          return d;
        }
        setWave((wv) => {
          const nextWave = Math.floor(next / WAVE_SIZE) + 1;
          if (nextWave !== wv) {
            soundManager.play('achievement');
            say(`🌊 WAVE ${nextWave}! 더 빨라진다!`, 'wave');
          }
          spawn(next, d, nextWave);
          return nextWave;
        });
        return d;
      });
      return next;
    });
  }, [finish, spawn]);

  /* 낙하 애니메이션 루프 */
  useEffect(() => {
    if (phase !== 'play') return;
    const loop = () => {
      const m = monsterRef.current;
      if (m && m.state === 'fall') {
        const p = Math.min(1, (performance.now() - m.bornAt) / m.fallMs);
        setProgress(p);
        if (p >= 1) onLanded();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    // 창을 벗어나 있는 동안은 멈춤
    const onVis = () => {
      const m = monsterRef.current;
      if (!m) return;
      if (document.hidden) pausedAtRef.current = performance.now();
      else if (pausedAtRef.current != null) {
        const gap = performance.now() - pausedAtRef.current;
        pausedAtRef.current = null;
        setMonster({ ...m, bornAt: m.bornAt + gap });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [phase, onLanded]);

  /* 키 입력 */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (phase !== 'play') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startGame();
      }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.key)) e.preventDefault();

    const m = monsterRef.current;
    if (!m || m.state !== 'fall') return;

    const cur: string[] = [];
    if (e.ctrlKey) cur.push('Ctrl');
    if (e.metaKey) cur.push('Command');
    if (e.altKey) cur.push('Alt');
    if (e.shiftKey) cur.push('Shift');
    let main = e.key;
    if (!MODIFIERS.includes(main)) {
      if (main === ' ') main = 'Space';
      else if (main.length === 1) main = main.toUpperCase();
      cur.push(main);
    }
    setPressed(cur);
    if (MODIFIERS.includes(e.key)) return; // 보조키만 누른 상태는 아직 판정 안 함

    if (comboMatches(m.quiz.keys, cur)) {
      // 💥 격파!
      e.preventDefault();
      const speedBonus = Math.round((1 - progress) * 100); // 빨리 잡을수록 보너스
      const nextCombo = combo + 1;
      const mult = Math.min(5, 1 + Math.floor(nextCombo / 3));
      const gained = (100 + speedBonus) * mult;
      setScore((s) => s + gained);
      setCombo(nextCombo);
      setMaxCombo((mc) => Math.max(mc, nextCombo));
      setKilled((k) => k + 1);
      setMonster({ ...m, state: 'boom' });
      setFlash('boom');
      window.setTimeout(() => setFlash('none'), 250);
      if (nextCombo % 3 === 0) soundManager.playCombo(nextCombo);
      else soundManager.playSuccess();
      say(`💥 +${gained.toLocaleString()}${mult > 1 ? `  x${mult} 콤보!` : ''}`, 'good');
      window.setTimeout(advance, 550);
    } else {
      // ✖ 틀림: 몬스터가 살짝 더 내려오고(벌칙) 힌트 표시
      soundManager.playError();
      setWrong((w) => w + 1);
      setCombo(0);
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      setMonster({ ...m, bornAt: m.bornAt - m.fallMs * 0.12 });
      setHint(`💡 ${m.quiz.hint || m.quiz.description}  →  ${m.quiz.keysDisplay}`);
      soundManager.playHint();
    }
  };

  const y = 6 + progress * 66; // 몬스터 세로 위치(%)
  const danger = progress > 0.7;
  const mult = Math.min(5, 1 + Math.floor(combo / 3));
  const waveKills = killed % WAVE_SIZE;

  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => ({ l: (i * 37) % 100, t: (i * 53) % 100, s: 1 + (i % 3) })), []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={focusGame}
      className={`sd-root outline-none select-none ${shake ? 'sd-shake' : ''}`}
      data-testid="shortcut-defense"
    >
      {/* 별 하늘 */}
      <div className="sd-sky">
        {stars.map((s, i) => (
          <i key={i} style={{ left: `${s.l}%`, top: `${s.t}%`, width: s.s, height: s.s }} />
        ))}
      </div>
      {flash !== 'none' && <div className={`sd-flash sd-flash--${flash}`} />}

      {/* HUD */}
      <div className="sd-hud">
        <div className="sd-hud-box">
          <span className="sd-hud-label">SCORE</span>
          <b className="sd-hud-num">{score.toLocaleString()}</b>
        </div>
        <div className="sd-hud-box">
          <span className="sd-hud-label">WAVE</span>
          <b className="sd-hud-num">{wave}</b>
          <span className="sd-hud-sub">{Math.min(WAVE_SIZE, waveKills)}/{WAVE_SIZE}</span>
        </div>
        <div className="sd-hud-box sd-hud-box--combo">
          <Flame className={`w-5 h-5 ${combo >= 3 ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`} />
          <b className="sd-hud-num">{combo}</b>
          <span className="sd-hud-sub">x{mult}</span>
        </div>
        <div className="sd-hud-box">
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <Heart key={i} className={`w-6 h-6 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`} />
          ))}
        </div>
        <div className="sd-hud-box">
          <span className="sd-hud-label">남은 몬스터</span>
          <b className="sd-hud-num">{Math.max(0, total - deckPos - (phase === 'play' ? 0 : 0))}</b>
        </div>
      </div>

      {/* 경기장 */}
      <div className="sd-field">
        {phase === 'play' && monster && (
          <div
            key={monster.id}
            className={`sd-monster ${monster.state === 'boom' ? 'sd-monster--boom' : ''} ${monster.state === 'hit' ? 'sd-monster--hit' : ''} ${danger ? 'sd-monster--danger' : ''}`}
            style={{ left: `${monster.x}%`, top: `${y}%` }}
          >
            <div className="sd-bubble">
              <div className="sd-bubble-q">{monster.quiz.question}</div>
              {hint && <div className="sd-bubble-hint">{hint}</div>}
            </div>
            <div className="sd-face">{monster.state === 'boom' ? '💥' : monster.face}</div>
            <div className="sd-fuse">
              <i style={{ width: `${(1 - progress) * 100}%` }} />
            </div>
          </div>
        )}

        {/* 눌린 키 표시 */}
        {phase === 'play' && (
          <div className="sd-keys">
            <Keyboard className="w-4 h-4 text-cyan-300" />
            {pressed.length ? (
              pressed.map((k, i) => (
                <kbd key={i} className="sd-kbd">
                  {k}
                </kbd>
              ))
            ) : (
              <span className="sd-keys-hint">몬스터를 물리칠 단축키를 실제로 눌러요! (예: Ctrl + C)</span>
            )}
          </div>
        )}

        {/* 땅 / 기지 */}
        <div className="sd-ground">
          <span className="sd-base">🏰</span>
          <span className="sd-base sd-base--2">🏠</span>
          <span className="sd-base">🏫</span>
        </div>

        {/* 시작 화면 */}
        {phase === 'ready' && (
          <div className="sd-overlay">
            <div className="sd-card">
              <div className="sd-title">⚡ 단축키 디펜스</div>
              <p className="sd-desc">
                하늘에서 <b>단축키 몬스터</b>가 내려와요!
                <br />
                몬스터가 말하는 일을 하는 <b>단축키를 진짜로 눌러서</b> 땅에 닿기 전에 물리치세요.
              </p>
              <ul className="sd-rules">
                <li>💥 맞히면 점수 + 콤보 (3콤보마다 배율 UP, 최대 x5)</li>
                <li>⏱ 빨리 잡을수록 보너스 점수</li>
                <li>💔 땅에 닿으면 하트 1개 — 3개 잃으면 끝</li>
                <li>🌊 8마리마다 웨이브 UP, 점점 빨라져요</li>
              </ul>
              <button type="button" className="sd-btn sd-btn--go" onClick={startGame}>
                <Play className="w-5 h-5" /> 시작 (Enter)
              </button>
            </div>
          </div>
        )}

        {/* 결과 화면 */}
        {(phase === 'over' || phase === 'clear') && (
          <div className="sd-overlay">
            <div className="sd-card">
              <div className="sd-title">{phase === 'clear' ? '🏆 완전 정복!' : '💀 GAME OVER'}</div>
              <p className="sd-desc">
                {phase === 'clear' ? `단축키 몬스터 ${total}마리를 모두 물리쳤어요!` : `웨이브 ${wave}에서 기지가 무너졌어요…`}
              </p>
              <div className="sd-result">
                <div>
                  <span>점수</span>
                  <b>{score.toLocaleString()}</b>
                </div>
                <div>
                  <span>격파</span>
                  <b>{killed}마리</b>
                </div>
                <div>
                  <span>최고 콤보</span>
                  <b>{maxCombo}</b>
                </div>
                <div>
                  <span>정확도</span>
                  <b>{killed + wrong > 0 ? Math.round((killed / (killed + wrong)) * 100) : 100}%</b>
                </div>
              </div>
              <p className="sd-points">
                {killed >= WAVE_SIZE ? (
                  <>
                    <Trophy className="w-4 h-4 text-amber-400" /> +{GAME_POINTS}P 지급!
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-slate-400" /> 한 웨이브(8마리)를 깨면 +{GAME_POINTS}P
                  </>
                )}
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button type="button" className="sd-btn sd-btn--go" onClick={startGame}>
                  <RotateCcw className="w-5 h-5" /> 다시 도전 (Enter)
                </button>
                {onBack && (
                  <button type="button" className="sd-btn" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" /> 미니게임 목록
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`sd-toast sd-toast--${toast.tone}`}>{toast.text}</div>}
      </div>
    </div>
  );
};
