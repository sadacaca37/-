import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import '@fontsource/jua';
import './index.css';

// 로그아웃 상태에서는 '게스트' 이름으로 저장되는 기록·포인트·진행도를 남기지 않음
// (설정값처럼 학생과 상관없는 것만 저장됨)
try {
  const rawSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key: string, value: string) {
    if (this === window.localStorage && /guest/i.test(key)) return;
    return rawSet.call(this, key, value);
  };
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
