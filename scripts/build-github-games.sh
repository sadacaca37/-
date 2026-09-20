#!/usr/bin/env bash
# 깃허브(sadacaca37/game) 원본 게임을 정적 파일로 빌드해 public/games/ 에 넣는 스크립트
# 사용법: bash scripts/build-github-games.sh /path/to/game-repo
set -e
GAME_REPO="${1:?game 저장소 경로를 넣어주세요 (예: ../game)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
build() { # $1=폴더명 $2=출력 이름
  cp -r "$GAME_REPO/GAME/$1" "$TMP/$2"
  ln -s "$ROOT/node_modules" "$TMP/$2/node_modules"
  if [ "$2" = "bubblebobble" ]; then
    # 원본의 로고 이미지가 개발 서버 전용 경로(/src/...)라 빌드 후 깨지는 문제만 수정
    sed -i "s#src=\"/src/assets/images/bubble_bobble_logo_1785682921790.jpg\"#src={logoImg}#" "$TMP/$2/src/components/HeaderUI.tsx"
    sed -i "0,/^import /s##import logoImg from '../assets/images/bubble_bobble_logo_1785682921790.jpg';\nimport #" "$TMP/$2/src/components/HeaderUI.tsx"
  fi
  (cd "$TMP/$2" && npx vite build --base=./ --outDir "$ROOT/public/games/$2" --emptyOutDir)
}
build 너구리 ponpoko
build 보글보글 bubblebobble
build 슈퍼마이오 supermario
cp "$GAME_REPO/GAME/라스터워/outputs/bridge-assault-3d.html" "$ROOT/public/games/lastwar/index.html"
echo "완료. 카트라이더는 포켓카트_실행.html 을 public/games/pocketkart/index.html 로 복사하세요."

# 비행기 슈팅: 깃허브 sadacaca37/airplane-game-v1 원본 빌드
# 사용법: AIRPLANE_REPO=../airplane-game-v1 bash scripts/build-github-games.sh ../game
if [ -n "$AIRPLANE_REPO" ]; then
  cp -r "$AIRPLANE_REPO" "$TMP/airplane" && rm -rf "$TMP/airplane/.git" "$TMP/airplane/node_modules"
  ln -s "$ROOT/node_modules" "$TMP/airplane/node_modules"
  (cd "$TMP/airplane" && npx vite build --base=./ --outDir "$ROOT/public/games/airplane" --emptyOutDir)
fi
