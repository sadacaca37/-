# 타자팡 (모아팡 안의 타자 연습)

- 주소: https://moapang.kr/taja/ (모아팡 https://moapang.kr 안 `taja/` 폴더)
- 2026-11-22부터 **AI 스튜디오는 쓰지 않음**. 이 저장소의 `main`이 타자팡 원본 코드.
- 저장: 모아팡 Firebase (방번호·이름 로그인, 학생 기록·명예의 전당·선생님께 보내기)
- 캐릭터: 모아팡 '캐릭터 꾸미기'(dress.html)의 옷차림을 그대로 씀 (`src/components/MoaCharacter.tsx`)

## 고치고 올리는 순서
1. 이 저장소에서 코드 고치기
2. `npm run build:moa` → `dist-moa/`
3. `dist-moa/` 내용을 `sadacaca37/moa` 저장소의 `taja/` 폴더로 바꿔 넣고 올리기

## 주의
- 그림 주소는 `./assets/...` (상대 주소)로 쓴다. `/assets/...`로 쓰면 moapang.kr 맨 위 assets를 찾아 그림이 깨짐.
- `server.ts`, `server/` 는 AI 스튜디오 시절 서버(지금 홈페이지에서는 안 씀).
