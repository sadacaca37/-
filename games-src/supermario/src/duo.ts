/**
 * 2인 대결 공용 모듈(public/games/_duo/duo.js)을 React 게임에서 쓰기 위한 얇은 연결.
 * duo.js는 index.html에서 <script src="../_duo/duo.js">로 먼저 불러온다.
 * 혼자 개발 서버(npm run dev)로 열면 duo.js가 없으므로 모든 함수가 조용히 아무 일도 안 한다.
 *
 * 원본: games-src/_shared/duo.ts — 고칠 때는 여기 고치고 각 게임 src/duo.ts로 복사
 */
export interface DuoResult {
  score?: number;
  cleared?: boolean;
  time?: number;
  label?: string;
}

export interface DuoApi {
  init(o: {
    game: string;
    title: string;
    mode?: 'score' | 'race';
    scoreLabel?: string;
    btnStyle?: string;
    hudStyle?: string;
    countdown?: boolean;
    onStart?: (settings: any, info: { round: number; seed: number; isHost: boolean }) => void;
  }): DuoApi;
  on(name: string, fn: (...a: any[]) => void): DuoApi;
  readonly active: boolean;
  readonly inRoom: boolean;
  readonly isHost: boolean;
  readonly playing: boolean;
  readonly round: number;
  readonly peerName: string;
  requestStart(settings?: any): boolean;
  send(state: Record<string, any>): void;
  peerState(): Record<string, any> | null;
  finish(result: DuoResult): void;
  drawTag(ctx: CanvasRenderingContext2D, x: number, y: number, text?: string): void;
  toast(msg: string): void;
}

export const duo = (): DuoApi | null => ((window as any).Duo as DuoApi) || null;

/** 공용 버튼 위치: 화면 아래 가운데 (게임 메뉴 버튼과 겹치지 않게) */
export const DUO_BOTTOM_CENTER = 'top:auto;bottom:8px;left:50%;right:auto;transform:translateX(-50%)';
