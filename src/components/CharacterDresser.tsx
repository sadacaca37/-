/**
 * 내 계정 안의 캐릭터 꾸미기 (모아팡 '캐릭터 꾸미기'와 같은 옷장 · 같은 그림)
 *  - 타자팡 회원: classes/tajapang/students/{회원}.outfit 에 저장
 *  - 모아팡 방번호로 들어온 학생: 모아팡 반 학생 기록에 저장
 *  - 선생님: 이 컴퓨터에만 저장
 */
import React, { useEffect, useRef, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserSession } from '../types';
import { currentOutfit, loadAvatarLib, MASTER_OUTFIT_KEY } from './MoaCharacter';
import { ensureUser, errText, fs, getMemberDress, getMoaSession, MEMBER_CID, MEMBER_DRESS_KEY, parseUserId, setMoaSession } from '../utils/moaFirebase';
import { soundManager } from '../utils/sound';

type Dir = 'front' | 'back' | 'left' | 'right';

export const CharacterDresser: React.FC<{ user: UserSession }> = ({ user }) => {
  const [A, setA] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [cat, setCat] = useState('hair');
  const [dir, setDir] = useState<Dir>('front');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const bigRef = useRef<HTMLCanvasElement | null>(null);
  const sheetRef = useRef<any>(null);
  const dirRef = useRef<Dir>('front');
  dirRef.current = dir;

  // 옷장 열기: 그림 202장을 다 받지 않고, 지금 입은 옷 그림만 먼저 받아 바로 보여 줌
  //  (옷 고르기 칸의 작은 그림은 칸마다 필요한 것만 받아 한 장씩 나눠 그림)
  useEffect(() => {
    let alive = true;
    void loadAvatarLib().then(async (lib) => {
      if (!alive) return;
      if (!lib) return setMsg('캐릭터 그림을 불러오지 못했어요. 인터넷을 확인해 주세요.');
      const start = lib.clean(currentOutfit() || lib.START);
      try {
        await lib.ready();
        await lib.ensure(start);
      } catch {}
      if (!alive) return;
      setA(lib);
      setMe(start);
    });
    return () => {
      alive = false;
    };
  }, [user.id]);

  // 큰 미리보기: 걷는 모습 (새 옷 그림은 받은 뒤에 바꿔 그림)
  useEffect(() => {
    if (!A || !me) return;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      try {
        sheetRef.current = A.sheet(me);
      } catch {}
    };
    if (A.need(me).every((id: string) => A.raw[id] !== undefined)) draw();
    else void A.ensure(me).then(draw);
    return () => {
      alive = false;
    };
  }, [A, me]);
  useEffect(() => {
    if (!A) return;
    const c = bigRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    let f = 0;
    const t = window.setInterval(() => {
      f++;
      if (sheetRef.current) A.drawFrame(ctx, sheetRef.current, dirRef.current, f, true, 256);
    }, 160);
    return () => window.clearInterval(t);
  }, [A]);

  const change = (next: any) => {
    setMe(A.clean(next));
    setDirty(true);
    setMsg('');
  };

  const save = async () => {
    if (!A || !me || busy) return;
    setBusy(true);
    setMsg('저장하는 중…');
    try {
      const outfit = A.clean(me);
      if (user.role === 'master') {
        localStorage.setItem(MASTER_OUTFIT_KEY, JSON.stringify(outfit));
      } else {
        const p = parseUserId(user.id);
        if (!p) throw new Error('학생 정보를 찾지 못했어요. 다시 로그인해 주세요.');
        await ensureUser();
        await setDoc(doc(fs, 'classes', p.cid, 'students', p.key), { name: user.name, outfit, seen: serverTimestamp() }, { merge: true });
        if (p.cid === MEMBER_CID) {
          const d = getMemberDress() || { cid: MEMBER_CID, key: p.key, name: user.name, className: user.studentId || '' };
          localStorage.setItem(MEMBER_DRESS_KEY, JSON.stringify({ ...d, outfit }));
        } else {
          const ms = getMoaSession();
          if (ms) setMoaSession({ ...ms, outfit } as any);
        }
      }
      window.dispatchEvent(new Event('moa-outfit-changed'));
      setDirty(false);
      setMsg('✅ 저장했어요! 지도와 성적표에도 이 옷으로 나와요.');
      try {
        soundManager.play('success');
      } catch {}
    } catch (e) {
      setMsg(`❌ ${errText(e)}`);
    } finally {
      setBusy(false);
    }
  };

  if (!A || !me)
    return (
      <div className="cd-box" data-testid="dresser">
        <div className="cd-loading">{msg || '👕 옷장을 여는 중이에요…'}</div>
      </div>
    );

  const category = A.CATS.find((c: any) => c.id === cat) || A.CATS[0];
  const options: { label: string; value: any; o: any }[] = [];
  if (category.skin) {
    A.SKIN.forEach((sk: any) => options.push({ label: sk.name, value: sk.k, o: { ...me, skin: sk.k, hat: null, face: null, hand: null, back: null } }));
  } else {
    if (!['top', 'hair', 'shoes'].includes(category.id)) options.push({ label: '없음', value: null, o: null });
    const bare: any = { skin: me.skin };
    A.PARTS.forEach((p: string) => (bare[p] = null));
    if (category.id === 'hat') bare.hair = 'hair_short';
    category.items.forEach(([id, label]: [string, string]) => {
      if (!A.have || A.have.has(id)) options.push({ label, value: id, o: { ...bare, [category.id]: id, [category.id + 'Color']: me[category.id + 'Color'] } });
    });
  }
  const pick = (value: any) => {
    soundManager.play('click');
    if (category.skin) change({ ...me, skin: value });
    else {
      const next = { ...me, [category.id]: value };
      if (value && ['hair', 'hat', 'top', 'bottom', 'outer', 'shoes'].includes(category.id)) next.suit = null;
      change(next);
    }
  };
  const colors = !category.skin && me[category.id] ? category.colors : null;

  return (
    <div className="cd-box" data-testid="dresser">
      <div className="cd-stage">
        <canvas ref={bigRef} width={256} height={256} className="cd-big" aria-label="내 캐릭터" />
        <div className="cd-dirs" role="group" aria-label="보는 방향">
          {([['front', '앞'], ['back', '뒤'], ['left', '왼쪽'], ['right', '오른쪽']] as [Dir, string][]).map(([d, l]) => (
            <button key={d} type="button" aria-pressed={dir === d} className={`cd-btn ${dir === d ? 'is-on' : ''}`} onClick={() => setDir(d)}>
              {l}
            </button>
          ))}
        </div>
        <div className="cd-dirs">
          <button type="button" className="cd-btn" onClick={() => change(A.random())}>
            🎲 아무거나
          </button>
          <button type="button" className="cd-btn" onClick={() => change(A.clean(A.START))}>
            ↺ 처음 옷
          </button>
        </div>
        <button type="button" className="cd-save" disabled={busy || !dirty} onClick={() => void save()} data-testid="dress-save">
          {busy ? '저장하는 중…' : dirty ? '💾 이 옷으로 저장하기' : '✔ 저장됨'}
        </button>
        {msg && <div className="cd-msg">{msg}</div>}
      </div>

      <div className="cd-closet">
        <div className="cd-tabs" role="tablist">
          {A.CATS.map((c: any) => (
            <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={`cd-btn ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="cd-items" role="radiogroup" aria-label={`${category.name} 고르기`}>
          {options.map((op) => {
            const on = category.skin ? me.skin === op.value : me[category.id] === op.value;
            return (
              <button key={String(op.value)} type="button" role="radio" aria-checked={on} className={`cd-item ${on ? 'is-on' : ''}`} onClick={() => pick(op.value)}>
                {op.o ? <Thumb A={A} o={op.o} /> : <span className="cd-none">✕</span>}
                <span>{op.label}</span>
              </button>
            );
          })}
        </div>
        {colors && (
          <div className="cd-colors">
            <span className="cd-colors-t">색깔</span>
            {colors.map((cl: any) => (
              <button
                key={cl.k}
                type="button"
                role="radio"
                aria-checked={me[category.id + 'Color'] === cl.k}
                aria-label={cl.name}
                title={cl.name}
                className={`cd-sw ${cl.k === 'orig' && category.id !== 'hair' ? 'orig' : ''} ${me[category.id + 'Color'] === cl.k ? 'is-on' : ''}`}
                style={cl.k === 'orig' && category.id !== 'hair' ? undefined : { background: cl.c }}
                onClick={() => change({ ...me, [category.id + 'Color']: cl.k })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- 옷 하나 미리보기 그림 ----------
 *  한꺼번에 그리면 느린 컴퓨터에서 창이 멈춘 것처럼 보여서, 한 번에 조금씩(한 화면 그릴 틈마다) 나눠 그림.
 *  한 번 그린 그림은 기억해 두어 다음에 열 때는 바로 보임. */
const thumbCache = new Map<string, string>();
const jobs: Array<() => void> = [];
let pumping = false;
function pump() {
  const t0 = performance.now();
  while (jobs.length && performance.now() - t0 < 10) {
    try {
      jobs.shift()!();
    } catch {}
  }
  if (jobs.length) window.setTimeout(pump, 16);
  else pumping = false;
}
function later(job: () => void) {
  jobs.push(job);
  if (!pumping) {
    pumping = true;
    window.setTimeout(pump, 0);
  }
}

const Thumb: React.FC<{ A: any; o: any }> = React.memo(({ A, o }) => {
  const key = JSON.stringify(o);
  const [src, setSrc] = useState(() => thumbCache.get(key) || '');
  useEffect(() => {
    const hit = thumbCache.get(key);
    if (hit) {
      setSrc(hit);
      return;
    }
    setSrc('');
    let alive = true;
    void A.ensure(o).then(() =>
      later(() => {
        if (!alive) return;
        try {
          const url = A.thumb(o).toDataURL('image/png');
          thumbCache.set(key, url);
          setSrc(url);
        } catch {}
      })
    );
    return () => {
      alive = false;
    };
  }, [A, key]);
  return src ? <img src={src} alt="" width={72} height={72} className="cd-thumb" draggable={false} /> : <span className="cd-none cd-wait" aria-hidden="true" />;
});
