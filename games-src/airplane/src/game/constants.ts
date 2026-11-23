import { PlaneConfig, StageInfo, HighScoreEntry, GameSettings } from '../types';
// 그림은 모두 Gemini(Nano Banana Pro)로 새로 그린 뒤 배경을 투명하게 다듬은 WebP 파일입니다.
import bgStage1 from '../assets/images/stage_1.webp';
import bgStage2 from '../assets/images/stage_2.webp';
import bgStage3 from '../assets/images/stage_3.webp';
import bgStage4 from '../assets/images/stage_4.webp';
import bgStage5 from '../assets/images/stage_5.webp';
import bgStage6 from '../assets/images/stage_6.webp';
import bgStage7 from '../assets/images/stage_7.webp';
import bgStage8 from '../assets/images/stage_8.webp';
import bgStage9 from '../assets/images/stage_9.webp';
import bgStage10 from '../assets/images/stage_10.webp';
import titleKeyArt from '../assets/images/title_keyart.webp';

import enemyScout from '../assets/images/enemy_scout.webp';
import enemyTwin from '../assets/images/enemy_twin.webp';
import enemyRed from '../assets/images/enemy_red.webp';
import enemySteel from '../assets/images/enemy_steel.webp';
import enemyBomber from '../assets/images/enemy_bomber.webp';
import enemyBatwing from '../assets/images/enemy_batwing.webp';
import alienDrone from '../assets/images/alien_drone.webp';
import alienClaw from '../assets/images/alien_claw.webp';
import alienEye from '../assets/images/alien_eye.webp';
import alienManta from '../assets/images/alien_manta.webp';
import alienBomber from '../assets/images/alien_bomber.webp';
import alienDart from '../assets/images/alien_dart.webp';

import bossSky from '../assets/images/boss_sky.webp';
import bossKraken from '../assets/images/boss_kraken.webp';
import bossSphinx from '../assets/images/boss_sphinx.webp';
import bossIgnis from '../assets/images/boss_ignis.webp';
import bossNeon from '../assets/images/boss_neon.webp';
import bossOrbital from '../assets/images/boss_orbital.webp';
import bossLeviathan from '../assets/images/boss_leviathan.webp';
import bossTemplar from '../assets/images/boss_templar.webp';
import bossFrost from '../assets/images/boss_frost.webp';
import bossNebula from '../assets/images/boss_nebula.webp';

import playerPhoenix from '../assets/images/player_phoenix.webp';
import playerBlueTempest from '../assets/images/player_blue_tempest.webp';
import playerValkyrie from '../assets/images/player_valkyrie.webp';
import playerStealth from '../assets/images/player_stealth.webp';
import playerSeraph from '../assets/images/player_seraph.webp';
import playerTitan from '../assets/images/player_titan.webp';

export const TITLE_KEY_ART = titleKeyArt;

export const PLAYER_PLANE_IMAGES: Record<string, string> = {
  AV8_HARRIER: playerPhoenix,
  FA18_SUPER_HORNET: playerBlueTempest,
  F4_PHANTOM: playerValkyrie,
  F117_NIGHTHAWK: playerStealth,
  VIOLET_SERAPH: playerSeraph,
  X36: playerTitan,
};

// 적기 그림 (모두 기수가 위를 향하게 그려져 있고, 게임에서 180도 돌려 아래를 보게 그림)
export const ENEMY_SHIP_IMAGES: Record<string, string> = {
  SCOUT: enemyScout,
  TWIN: enemyTwin,
  RED: enemyRed,
  STEEL: enemySteel,
  BOMBER: enemyBomber,
  BATWING: enemyBatwing,
  A_DRONE: alienDrone,
  A_CLAW: alienClaw,
  A_EYE: alienEye,
  A_MANTA: alienManta,
  A_BOMBER: alienBomber,
  A_DART: alienDart,
};

// 스테이지별 보스 그림 (모두 앞쪽이 아래 = 플레이어 쪽을 보도록 그려져 있음)
export const BOSS_IMAGES: Record<string, string> = {
  BOSS_STAGE_1: bossSky,
  BOSS_STAGE_2: bossKraken,
  BOSS_STAGE_3: bossSphinx,
  BOSS_STAGE_4: bossIgnis,
  BOSS_STAGE_5: bossNeon,
  BOSS_STAGE_6: bossOrbital,
  BOSS_STAGE_7: bossLeviathan,
  BOSS_STAGE_8: bossTemplar,
  BOSS_STAGE_9: bossFrost,
  BOSS_STAGE_10: bossNebula,
};

export const STAGE_BG_IMAGES: Record<number, string> = {
  1: bgStage1,
  2: bgStage2,
  3: bgStage3,
  4: bgStage4,
  5: bgStage5,
  6: bgStage6,
  7: bgStage7,
  8: bgStage8,
  9: bgStage9,
  10: bgStage10,
};

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 640;

// 비행기 성능
// - 기체마다 무기 방식(weapon)이 다르고, 좋은 점과 아쉬운 점이 하나씩 있어요.
// - power(화력) 3~5 는 실제 총알 피해에 곱해집니다 (3=0.9배, 4=1배, 5=1.12배).
// - 예전에는 05·06번이 모든 수치가 높은 '엘리트'였지만, 이제는 모두 비슷하게 강하고 개성만 다릅니다.
export const PLANES: Record<string, PlaneConfig> = {
  AV8_HARRIER: {
    id: 'AV8_HARRIER',
    name: '01. PHOENIX STRIKE',
    koreanName: '01. 피닉스 스트라이크',
    codename: 'Orange Phoenix',
    type: 'SPREAD',
    koreanType: '확산형',
    weapon: 'WIDE',
    strength: '총알이 부채꼴로 넓게 퍼져 잔챙이 적을 쓸어 담아요',
    weakness: '먼 곳의 큰 적에게는 힘이 조금 약해요',
    country: 'ALLIED',
    flag: '🔥',
    speed: 5.4,
    fireRate: 7.5,
    power: 3,
    bombPower: 150,
    bombType: 'SUPER_TOMAHAWK',
    bombName: 'Super Tomahawk',
    koreanBombName: '슈퍼 토마호크',
    bombDesc: '화면 전체에 미사일 폭격! 적 총알을 모두 메달로 바꿔요',
    specialMove: '5방향 확산 발칸',
    color: '#f97316',
    accentColor: '#fde047',
    description: '오렌지 & 화이트 전투기. 넓게 퍼지는 확산탄으로 처음 하는 친구에게 추천!',
  },
  FA18_SUPER_HORNET: {
    id: 'FA18_SUPER_HORNET',
    name: '02. BLUE TEMPEST',
    koreanName: '02. 블루 템페스트',
    codename: 'Carrier Fleet Ace',
    type: 'FOCUSED',
    koreanType: '집중형',
    weapon: 'FOCUS',
    strength: '앞쪽으로 총알을 모아 쏴서 보스를 가장 빨리 잡아요',
    weakness: '옆쪽 적은 직접 따라가서 맞혀야 해요',
    country: 'NAVAL',
    flag: '⭐',
    speed: 5.0,
    fireRate: 9.0,
    power: 5,
    bombPower: 140,
    bombType: 'SAMURAI_SWORD',
    bombName: 'Blade Slash',
    koreanBombName: '블레이드 슬래시',
    bombDesc: '거대한 검기 파동으로 적과 적 총알을 한 번에 베어 내요',
    specialMove: '집중 발칸 + 관통 레이저',
    color: '#3b82f6',
    accentColor: '#93c5fd',
    description: '로열 블루 & 화이트 함재기. 정면 화력이 가장 센 보스 사냥꾼.',
  },
  F4_PHANTOM: {
    id: 'F4_PHANTOM',
    name: '03. VALKYRIE EMERALD',
    koreanName: '03. 발키리 에메랄드',
    codename: 'Emerald Interceptor',
    type: 'SPREAD',
    koreanType: '관통형',
    weapon: 'PIERCE',
    strength: '초록 빛탄이 적을 뚫고 지나가서 줄지어 오는 적에게 강해요',
    weakness: '연사가 조금 느려요',
    country: 'ALLIED',
    flag: '🌿',
    speed: 5.2,
    fireRate: 6.2,
    power: 4,
    bombPower: 150,
    bombType: 'THUNDERBOLT',
    bombName: 'Thunderbolt EMP',
    koreanBombName: '썬더볼트 EMP',
    bombDesc: '화면 전체에 번개 폭풍! 적 총알을 모두 지워요',
    specialMove: '관통 웨이브탄',
    color: '#10b981',
    accentColor: '#6ee7b7',
    description: '에메랄드 그린 곡선 날개 요격기. 적을 꿰뚫는 관통탄이 특기.',
  },
  F117_NIGHTHAWK: {
    id: 'F117_NIGHTHAWK',
    name: '04. STEALTH STORM',
    koreanName: '04. 스텔스 스톰',
    codename: 'Dark Cyan Shadow',
    type: 'SPREAD',
    koreanType: '유도형',
    weapon: 'HOMING',
    strength: '가장 빠르고, 유도 미사일이 알아서 적을 쫓아가요',
    weakness: '총알 한 발의 힘이 약해요',
    country: 'STEALTH',
    flag: '💠',
    speed: 6.4,
    fireRate: 7.0,
    power: 3,
    bombPower: 140,
    bombType: 'CLUSTER_BOMB',
    bombName: 'EMP Cluster',
    koreanBombName: 'EMP 클러스터',
    bombDesc: '화면 곳곳에서 연속 폭발! 적 총알을 모두 지워요',
    specialMove: '유도 미사일 + 쌍발 발칸',
    color: '#22d3ee',
    accentColor: '#94a3b8',
    description: '티타늄 그레이 & 시안 스텔스기. 피하기 쉬운 최고 속도와 유도 미사일.',
  },
  VIOLET_SERAPH: {
    id: 'VIOLET_SERAPH',
    name: '05. VIOLET SERAPH',
    koreanName: '05. 바이올렛 세라프',
    codename: 'Heart Seraph',
    type: 'SPREAD',
    koreanType: '만능형',
    weapon: 'SERAPH',
    strength: '앞쪽 레이저와 양옆 하트탄을 함께 쏘는 만능 기체예요',
    weakness: '폭탄 힘이 조금 약한 대신 무적 시간이 길어요',
    country: 'CELESTIAL',
    flag: '💜',
    speed: 5.6,
    fireRate: 7.2,
    power: 4,
    bombPower: 120,
    bombType: 'SUPER_TOMAHAWK',
    bombName: 'Seraph Holy Burst',
    koreanBombName: '세라프 홀리 버스트',
    bombDesc: '보랏빛 날개 빛으로 적 총알을 지우고 오랫동안 무적이 돼요',
    specialMove: '레이저 + 하트 확산탄',
    color: '#a855f7',
    accentColor: '#f472b6',
    description: '퍼플 & 화이트 천사 날개 전투기. 공격과 수비가 고르게 좋아요.',
  },
  X36: {
    id: 'X36',
    name: '06. BLACK GOLD TITAN',
    koreanName: '06. 블랙 골드 타이탄',
    codename: 'Apex Tailless Titan',
    type: 'FOCUSED',
    koreanType: '레이저형',
    weapon: 'LASER',
    strength: '굵은 쌍둥이 레이저가 적을 꿰뚫어요. 한 방이 가장 세요',
    weakness: '연사가 가장 느려서 타이밍이 중요해요',
    country: 'EXPERIMENTAL',
    flag: '⚡',
    speed: 5.6,
    fireRate: 5.2,
    power: 5,
    bombPower: 170,
    bombType: 'MEGA_SMASH',
    bombName: 'Mega Smash',
    koreanBombName: '메가 스매시',
    bombDesc: '가장 강한 폭탄! 화면의 모든 적에게 큰 피해를 줘요',
    specialMove: '쌍둥이 하이퍼 레이저',
    color: '#eab308',
    accentColor: '#fde68a',
    description: '블랙 & 골드 무미익 실험기. 묵직한 레이저 한 방의 손맛.',
  },
};

export const STAGES: StageInfo[] = [
  {
    stageNumber: 1,
    title: 'STAGE 1: 푸른 하늘',
    subtitle: '에메랄드빛 군도 상공 및 선봉 요격 편대 (AZURE SKY)',
    theme: 'RAILWAY_FOREST',
    bgSpeed: 1.4,
    bossType: 'BOSS_STAGE_1',
    bossName: '선봉 초계모함 "스카이 포트리스"',
    durationSeconds: 22,
    difficultyRating: 'RECON PATROL (EASY INTRO)',
    dangerLevel: 1,
    description: '맑고 푸른 열대 바다와 섬 상공에서 펼쳐지는 입문 정찰 공중전.',
  },
  {
    stageNumber: 2,
    title: 'STAGE 2: 심해 군항',
    subtitle: '어둠의 심해 기지 & 해상 요새 함대 (DEEP SEA NAVAL PORT)',
    theme: 'OCEAN',
    bgSpeed: 1.4,
    bossType: 'BOSS_STAGE_2',
    bossName: '초중장갑 심해 모선 "크라켄 드레드노트"',
    durationSeconds: 35,
    difficultyRating: 'NAVAL COMBAT',
    dangerLevel: 2,
    description: '심해의 푸른 군항 도크와 중무장 함선들의 집중 포화를 돌파하라.',
  },
  {
    stageNumber: 3,
    title: 'STAGE 3: 사막 유적',
    subtitle: '황금빛 고대 신전 지대 & 요새 방어선 (DESERT RUINS)',
    theme: 'FORTRESS',
    bgSpeed: 1.6,
    bossType: 'BOSS_STAGE_3',
    bossName: '사막 거대 육상우주모함 "스핑크스 타이탄"',
    durationSeconds: 38,
    difficultyRating: 'DESERT ASSAULT',
    dangerLevel: 2,
    description: '모래 폭풍이 몰아치는 고대 유적 협곡과 지상 포대 요새망.',
  },
  {
    stageNumber: 4,
    title: 'STAGE 4: 화산 지대',
    subtitle: '불타는 용암 계곡 & 마그마 분화구 요새 (VOLCANIC ZONE)',
    theme: 'SUNSET_CLOUDS',
    bgSpeed: 1.8,
    bossType: 'BOSS_STAGE_4',
    bossName: '마그마 거대 중전함 "이그니스 발칸"',
    durationSeconds: 40,
    difficultyRating: 'INFERNO HELL',
    dangerLevel: 3,
    description: '이글거리는 붉은 용암과 화산탄 분출 지대를 비행하며 적을 격추하라.',
  },
  {
    stageNumber: 5,
    title: 'STAGE 5: 미래 도시',
    subtitle: '초고층 네온 메가로폴리스 공중 회랑 (CYBER METROPOLIS)',
    theme: 'NIGHT_BASE',
    bgSpeed: 2.0,
    bossType: 'BOSS_STAGE_5',
    bossName: '사이버네틱 메가 공중모함 "네온 타이탄"',
    durationSeconds: 42,
    difficultyRating: 'CYBER RAID',
    dangerLevel: 3,
    description: '네온 불빛이 번쩍이는 미래 사이버 도시의 빌딩 숲 사이를 관통.',
  },
  {
    stageNumber: 6,
    title: 'STAGE 6: 우주 기지',
    subtitle: '지구 궤도 거대 우주 정거장 결전 (ORBITAL SPACE STATION)',
    theme: 'FORTRESS',
    bgSpeed: 1.8,
    bossType: 'BOSS_STAGE_6',
    bossName: '궤도 요새 기동우주모선 "오비탈 데스스타"',
    durationSeconds: 45,
    difficultyRating: 'ORBITAL SIEGE',
    dangerLevel: 4,
    description: '대기권을 뚫고 도달한 지구 궤도 우주 요새의 레이저 방어망.',
  },
  {
    stageNumber: 7,
    title: 'STAGE 7: 폭풍의 바다',
    subtitle: '격랑의 뇌우 폭풍 해역 & 번개 탄막 (STORM OCEAN)',
    theme: 'OCEAN',
    bgSpeed: 2.2,
    bossType: 'BOSS_STAGE_7',
    bossName: '폭풍 뇌격 플라즈마 모함 "발키리 리바이어던"',
    durationSeconds: 48,
    difficultyRating: 'TEMPEST STORM',
    dangerLevel: 4,
    description: '거친 파도와 번개가 내리치는 암흑의 폭풍 해역 공중전.',
  },
  {
    stageNumber: 8,
    title: 'STAGE 8: 천공의 섬',
    subtitle: '구름 바다 위 부유섬 & 고대 천공 요새 (SKY ISLANDS)',
    theme: 'SUNSET_CLOUDS',
    bgSpeed: 1.9,
    bossType: 'BOSS_STAGE_8',
    bossName: '천공의 부유 요새 모함 "스카이 템플러"',
    durationSeconds: 50,
    difficultyRating: 'AERIAL DOMINANCE',
    dangerLevel: 5,
    description: '하늘에 떠 있는 신비로운 부유섬들과 폭포수를 가로지르는 비행.',
  },
  {
    stageNumber: 9,
    title: 'STAGE 9: 빙하 협곡',
    subtitle: '극지 만년설 빙벽 & 서리 협곡 돌파 (GLACIER CANYON)',
    theme: 'RAILWAY_FOREST',
    bgSpeed: 2.0,
    bossType: 'BOSS_STAGE_9',
    bossName: '극지 초중빙하 우주전함 "프로스트 자이언트"',
    durationSeconds: 52,
    difficultyRating: 'FROST APEX',
    dangerLevel: 5,
    description: '푸른 빙하 균열과 깎아지른 얼음 절벽 사이의 고난도 탄막 돌파.',
  },
  {
    stageNumber: 10,
    title: 'STAGE 10: 외계 행성',
    subtitle: '신비의 보랏빛 성간 모선 최종 결전 (ALIEN PLANET FINAL)',
    theme: 'NIGHT_BASE',
    bgSpeed: 2.4,
    bossType: 'BOSS_STAGE_10',
    bossName: '궁극의 성간 외계 모선 "네뷸라 아포칼립스"',
    durationSeconds: 55,
    difficultyRating: 'FINAL BULLET HELL',
    dangerLevel: 5,
    description: '보랏빛 크리스털 행성에서 인류의 명운을 건 최후의 결전!',
  },
];

export const INITIAL_HIGH_SCORES: HighScoreEntry[] = [
  { rank: 1, name: 'ACE', score: 980000, stage: 10, planeId: 'X36', date: '2026.08.28' },
  { rank: 2, name: 'TOP', score: 875000, stage: 10, planeId: 'VIOLET_SERAPH', date: '2026.08.28' },
  { rank: 3, name: 'KOR', score: 790000, stage: 9, planeId: 'FA18_SUPER_HORNET', date: '2026.08.27' },
  { rank: 4, name: 'SKY', score: 720000, stage: 9, planeId: 'AV8_HARRIER', date: '2026.08.27' },
  { rank: 5, name: 'FOX', score: 660000, stage: 8, planeId: 'F117_NIGHTHAWK', date: '2026.08.26' },
  { rank: 6, name: 'VIP', score: 610000, stage: 8, planeId: 'F4_PHANTOM', date: '2026.08.26' },
  { rank: 7, name: 'MAX', score: 565000, stage: 7, planeId: 'X36', date: '2026.08.25' },
  { rank: 8, name: 'NEO', score: 520000, stage: 7, planeId: 'VIOLET_SERAPH', date: '2026.08.25' },
  { rank: 9, name: 'RED', score: 480000, stage: 6, planeId: 'FA18_SUPER_HORNET', date: '2026.08.24' },
  { rank: 10, name: 'JET', score: 445000, stage: 6, planeId: 'AV8_HARRIER', date: '2026.08.24' },
  { rank: 11, name: 'AIR', score: 410000, stage: 5, planeId: 'F117_NIGHTHAWK', date: '2026.08.23' },
  { rank: 12, name: 'WIN', score: 380000, stage: 5, planeId: 'F4_PHANTOM', date: '2026.08.23' },
  { rank: 13, name: 'GOD', score: 350000, stage: 5, planeId: 'X36', date: '2026.08.22' },
  { rank: 14, name: 'WAR', score: 325000, stage: 4, planeId: 'VIOLET_SERAPH', date: '2026.08.22' },
  { rank: 15, name: 'SUN', score: 300000, stage: 4, planeId: 'FA18_SUPER_HORNET', date: '2026.08.21' },
  { rank: 16, name: 'MOO', score: 275000, stage: 4, planeId: 'AV8_HARRIER', date: '2026.08.21' },
  { rank: 17, name: 'SAM', score: 250000, stage: 3, planeId: 'F117_NIGHTHAWK', date: '2026.08.20' },
  { rank: 18, name: 'LEE', score: 230000, stage: 3, planeId: 'F4_PHANTOM', date: '2026.08.20' },
  { rank: 19, name: 'PAR', score: 210000, stage: 3, planeId: 'X36', date: '2026.08.19' },
  { rank: 20, name: 'CHO', score: 190000, stage: 3, planeId: 'VIOLET_SERAPH', date: '2026.08.19' },
  { rank: 21, name: 'HAN', score: 170000, stage: 2, planeId: 'FA18_SUPER_HORNET', date: '2026.08.18' },
  { rank: 22, name: 'JIN', score: 155000, stage: 2, planeId: 'AV8_HARRIER', date: '2026.08.18' },
  { rank: 23, name: 'BAE', score: 140000, stage: 2, planeId: 'F117_NIGHTHAWK', date: '2026.08.17' },
  { rank: 24, name: 'MIN', score: 125000, stage: 2, planeId: 'F4_PHANTOM', date: '2026.08.17' },
  { rank: 25, name: 'RYU', score: 110000, stage: 1, planeId: 'X36', date: '2026.08.16' },
  { rank: 26, name: 'KIM', score: 95000, stage: 1, planeId: 'VIOLET_SERAPH', date: '2026.08.16' },
  { rank: 27, name: 'JHO', score: 80000, stage: 1, planeId: 'FA18_SUPER_HORNET', date: '2026.08.15' },
  { rank: 28, name: 'SHI', score: 65000, stage: 1, planeId: 'AV8_HARRIER', date: '2026.08.15' },
  { rank: 29, name: 'YOO', score: 50000, stage: 1, planeId: 'F117_NIGHTHAWK', date: '2026.08.14' },
  { rank: 30, name: 'NEW', score: 35000, stage: 1, planeId: 'F4_PHANTOM', date: '2026.08.14' },
];

export const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.7,
  musicVolume: 0.5,
  crtFilter: false,
  scanlines: false,
  screenShake: true,
  autoFire: false,
  difficulty: 'NORMAL',
  controls: 'KEYBOARD',
};
