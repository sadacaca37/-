import React from 'react';
import { IframeGame } from './IframeGame';

/** 미리보기(claude.ai)에서는 카트 파일이 너무 커서 따로 만든 미리보기 페이지로 연결 */
const KART_PREVIEW_URL = 'https://claude.ai/artifact/HQsuKUJuPvk7mnrsfgU9zm';
const isClaudePreview = () => {
  try {
    return /claudeusercontent\.com$|claude\.ai$/.test(window.location.hostname);
  } catch {
    return false;
  }
};

/** 카트라이더 – GAME/카트라이더 원본(포켓 카트) 그대로 실행 */
export const PocketKartOriginal: React.FC<{ onBack?: () => void }> = () => {
  if (isClaudePreview()) {
    return (
      <div className="ifg flex items-center justify-center" style={{ background: '#112438' }}>
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="text-6xl">🏎️</div>
          <h3 className="text-2xl font-black text-white">카트라이더</h3>
          <p className="text-sm text-slate-200 leading-relaxed">
            미리보기 화면에서는 카트 게임 파일이 커서 여기 안에서 바로 열 수 없어요.
            <br />
            아래 버튼을 누르면 새 탭에서 카트라이더가 열려요. (실제 타자팡팡 사이트에서는 이 자리에서 바로 실행돼요)
          </p>
          <a
            href={KART_PREVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-2xl bg-lime-300 hover:bg-lime-200 text-slate-900 text-lg font-black"
          >
            카트라이더 새 탭에서 열기 →
          </a>
        </div>
      </div>
    );
  }
  return <IframeGame src="games/kartrider/index.html" title="카트라이더" icon="🏎️" />;
};
