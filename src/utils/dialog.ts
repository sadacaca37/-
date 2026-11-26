/**
 * 화면 안에 뜨는 확인/알림 창
 * 브라우저 기본 confirm()/alert() 는 미리보기(샌드박스)나 일부 학교 PC 설정에서 막혀
 * "휴지통을 눌러도 아무 일도 안 일어나는" 문제가 생겨서 직접 그립니다.
 */
function makeBox(message: string, buttons: { label: string; primary?: boolean; value: boolean }[]): Promise<boolean> {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.55)';
    const box = document.createElement('div');
    box.style.cssText =
      "max-width:380px;width:100%;background:#fff;border:4px solid #1b2340;border-radius:18px;box-shadow:0 6px 0 #1b2340;padding:20px;font-family:'Noto Sans KR',system-ui,sans-serif;text-align:center";
    const p = document.createElement('p');
    p.textContent = message;
    p.style.cssText = 'margin:0 0 16px;font-size:15px;font-weight:800;color:#1e293b;white-space:pre-line;line-height:1.5';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:center';
    const close = (v: boolean) => {
      document.removeEventListener('keydown', onKey, true);
      wrap.remove();
      resolve(v);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Enter') { e.preventDefault(); close(buttons.find((b) => b.primary)?.value ?? true); }
    };
    buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = b.label;
      btn.style.cssText = `flex:1;padding:10px 12px;border-radius:12px;font-weight:900;font-size:14px;cursor:pointer;border:3px solid #1b2340;${
        b.primary ? 'background:#ff5f7e;color:#fff' : 'background:#f1f5f9;color:#1e293b'
      }`;
      btn.onclick = () => close(b.value);
      row.appendChild(btn);
    });
    wrap.onclick = (e) => { if (e.target === wrap) close(false); };
    box.append(p, row);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    document.addEventListener('keydown', onKey, true);
    (row.lastElementChild as HTMLButtonElement | null)?.focus();
  });
}

export const askConfirm = (message: string, okLabel = '확인') =>
  makeBox(message, [
    { label: '취소', value: false },
    { label: okLabel, primary: true, value: true },
  ]);

export const showAlert = (message: string) => makeBox(message, [{ label: '확인', primary: true, value: true }]).then(() => undefined);

/**
 * 여러 가지 중에서 고르는 창 (예: 보관하기 / 완전히 삭제 / 취소)
 *  - 고르지 않고 닫으면(취소·Esc·바깥 누르기) null
 */
export function askChoice<T extends string>(
  message: string,
  options: { value: T; label: string; desc?: string; tone?: 'primary' | 'danger' | 'plain' }[],
): Promise<T | null> {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.55)';
    const box = document.createElement('div');
    box.style.cssText =
      "max-width:420px;width:100%;background:#fff;border:4px solid #1b2340;border-radius:18px;box-shadow:0 6px 0 #1b2340;padding:20px;font-family:'Noto Sans KR',system-ui,sans-serif;text-align:center";
    const p = document.createElement('p');
    p.textContent = message;
    p.style.cssText = 'margin:0 0 14px;font-size:15px;font-weight:800;color:#1e293b;white-space:pre-line;line-height:1.5';
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:8px';
    const close = (v: T | null) => {
      document.removeEventListener('keydown', onKey, true);
      wrap.remove();
      resolve(v);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(null);
      }
    };
    const colors = { primary: 'background:#fff7d6;color:#1e293b', danger: 'background:#ffe4e6;color:#9f1239', plain: 'background:#f1f5f9;color:#1e293b' };
    for (const o of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = `display:block;width:100%;text-align:left;padding:10px 14px;border-radius:12px;cursor:pointer;border:3px solid #1b2340;${colors[o.tone || 'plain']}`;
      const t = document.createElement('div');
      t.textContent = o.label;
      t.style.cssText = 'font-weight:900;font-size:15px';
      b.appendChild(t);
      if (o.desc) {
        const dsc = document.createElement('div');
        dsc.textContent = o.desc;
        dsc.style.cssText = 'margin-top:2px;font-weight:700;font-size:12px;opacity:.8;line-height:1.4';
        b.appendChild(dsc);
      }
      b.onclick = () => close(o.value);
      col.appendChild(b);
    }
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = '취소';
    cancel.style.cssText = 'margin-top:4px;padding:8px 12px;border-radius:12px;font-weight:900;font-size:14px;cursor:pointer;border:3px solid #1b2340;background:#fff;color:#1e293b';
    cancel.onclick = () => close(null);
    col.appendChild(cancel);
    wrap.onclick = (e) => {
      if (e.target === wrap) close(null);
    };
    box.append(p, col);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    document.addEventListener('keydown', onKey, true);
    cancel.focus();
  });
}
