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
