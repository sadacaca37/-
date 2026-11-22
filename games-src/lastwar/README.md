# Bridge Assault

5개 스테이지, 6종 보스, 단계별 난이도, 배경음악을 포함한 브라우저 게임입니다. 4.0부터 캐릭터는 제미나이가 그린 그림입니다.

## 바로 실행

outputs/bridge-assault-3d.html 파일을 Chrome 또는 Edge에서 열어 주세요. 인터넷 연결 없이 플레이할 수 있습니다.

## 수정 후 실행

Node.js를 설치한 뒤 이 폴더에서 실행합니다. 별도 npm 패키지 설치는 필요하지 않습니다.

```sh
npm run build
npm start
```

브라우저에서 http://127.0.0.1:8766/ 을 엽니다.

- work/: 게임 소스와 빌드 도구, 포함된 Three.js 라이브러리 (sprites.js: 아군·몬스터 그림 표시와 움직임, boss-render.js: 보스 그림과 움직임, sfx.js: 효과음, music.js: 배경음악, duo-lastwar.js: 2인 대결)
- work/art/: 제미나이가 그린 캐릭터 그림(배경 지운 PNG), work/sprite-atlas.js: 그 그림들을 한 장으로 묶은 자동 생성 파일
- tools/: 그림 자르기(cutout.py), 그림 묶기(atlas.py), 난이도 자동 플레이 측정(sim.js: `node tools/sim.js`)
- outputs/: 실행 가능한 HTML과 게임 안내
- npm test: 게임 로직 점검. 최종 스테이지 자동 전투 패배는 현재 알려진 밸런스 결과이며, 클리어 가능성을 보장하지 않습니다.

## Git에 올리기

이 폴더의 전체 내용을 저장소에 넣어 주세요. 소스코드와 실행 파일을 함께 관리할 수 있습니다.

```sh
git init
git add .
git commit -m "Add Bridge Assault game"
```

이후 원하는 원격 저장소를 연결해 push합니다. 위 명령은 원격 업로드를 수행하지 않습니다.

## 외부 자료

Three.js는 THREE-LICENSE.txt, 자연물 모델은 Kenney-Nature-License.txt를 참고하세요. 배경음악은 게임 코드에서 합성합니다. 외부 자료의 라이선스 파일을 함께 유지해 주세요.
