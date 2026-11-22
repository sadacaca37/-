// 제미나이 그림으로 게임 화면을 그리는 함수들.
// 각 함수는 그림으로 그렸으면 true, 아직 그림이 준비되지 않았으면 false를 돌려준다
// (false면 sprites.ts의 예전 코드 그림이 대신 그려진다).

import { Art } from './art';
import { Player, Enemy, Block, ItemEntity, Projectile, CharacterType } from '../types';

// 주인공 5명: 그림 이름, 기준 키(서 있는 그림 높이), 머리 위치(위에서부터 비율), 머리의 앞쪽 치우침
const HEROES: Record<CharacterType, { key: string; refH: number; head: number; headX: number }> = {
  mario: { key: 'fox', refH: 62, head: 0.04, headX: 0.1 }, // 여우 토리
  luigi: { key: 'frog', refH: 62, head: 0.0, headX: 0.05 }, // 개구리 퐁이
  toad: { key: 'rabbit', refH: 70, head: 0.27, headX: 0.12 }, // 토끼 토토
  peach: { key: 'fairy', refH: 64, head: 0.03, headX: 0.06 }, // 꽃요정 라라
  yoshi: { key: 'dragon', refH: 59, head: 0.05, headX: 0.14 }, // 아기 용 용이
};

const BIG_H = 50; // 커진 주인공 키(게임 화면 픽셀)
const SMALL_H = 36; // 작은 주인공 키

function hero(p: Player) {
  return HEROES[p.character] || HEROES.mario;
}

function heroFrame(p: Player): string {
  const k = hero(p).key;
  if (!p.isGrounded || p.isFluttering) return k + '_jump';
  if (Math.abs(p.vx) > 0.3) return k + (Math.floor(p.walkFrame / 1.4) % 2 === 0 ? '_run1' : '_run2');
  return k + '_idle';
}

const STAR_HUES = ['#ff3366', '#ffcc00', '#33cc33', '#3399ff', '#cc33ff'];

// ───────────────────────── 주인공 ─────────────────────────
export function drawPlayerArt(ctx: CanvasRenderingContext2D, p: Player, now: number): boolean {
  if (!Art.ready()) return false;
  const H = hero(p);
  const flip = p.facing === 'left';
  const dir = flip ? -1 : 1;
  const cx = p.x + p.width / 2;
  const bottom = p.y + p.height + 1;

  ctx.save();
  if (p.starmanTimer > 0) {
    ctx.shadowColor = STAR_HUES[Math.floor(now / 80) % STAR_HUES.length];
    ctx.shadowBlur = 12;
  }

  // ── 탈것 ──
  if (p.vehicle === 'yoshi') {
    // 보라 카멜레온: 등의 방석 위에 주인공이 앉음
    const moving = Math.abs(p.vx) > 0.3;
    const mf = !p.isGrounded ? 'cham_jump' : moving ? (Math.floor(now / 140) % 2 ? 'cham_walk1' : 'cham_walk2') : 'cham_stand';
    const ms = 46 / 58;
    const bob = p.isFluttering ? Math.sin(now / 35) * 2 : 0;
    const mountTop = bottom - Art.h(mf) * ms + bob;
    Art.foot(ctx, H.key + '_idle', cx - dir * 6, mountTop + 14, 36 / H.refH, flip, fireTint(p));
    Art.foot(ctx, mf, cx, bottom + bob, ms, flip);
    drawCharge(ctx, p, cx, bottom - 24);
    ctx.restore();
    return true;
  }
  if (p.vehicle === 'clown_car' || p.vehicle === 'fire_clown_car') {
    // 하늘을 나는 찻잔: 주인공은 찻잔 안에 들어가 있음
    const cup = p.vehicle === 'fire_clown_car' ? 'cup_fire' : 'cup';
    const bob = Math.sin(now / 150) * 2;
    const cs = 44 / 49;
    const cupTop = bottom + bob - Art.h(cup) * cs;
    Art.foot(ctx, H.key + '_idle', cx, cupTop + Art.h(cup) * cs * 0.55, 34 / H.refH, flip, fireTint(p));
    Art.foot(ctx, cup, cx, bottom + bob, cs, flip);
    drawCharge(ctx, p, cx, cupTop + 10);
    ctx.restore();
    return true;
  }
  if (p.vehicle === 'dry_bones_shell') {
    if (p.isDeadBonesDucking) {
      // 돌 껍질 속에 쏙 숨음
      Art.foot(ctx, 'stone_shell_closed', cx, bottom, 32 / 55, flip);
      ctx.restore();
      return true;
    }
    const s = (p.powerUp === 'none' ? SMALL_H : BIG_H) / H.refH;
    Art.foot(ctx, H.key + '_idle', cx, bottom - 4, s, flip, fireTint(p));
    Art.foot(ctx, 'stone_shell', cx, bottom + 1, 36 / 66, flip);
    ctx.restore();
    return true;
  }

  // ── 걷고 뛰는 주인공 ──
  const isSmall = p.powerUp === 'none';
  const targetH = isSmall ? SMALL_H : BIG_H;
  const frame = p.isCrouching ? H.key + '_idle' : heroFrame(p);
  let s = targetH / H.refH;
  let sx = 1;
  let sy = 1;
  if (p.isCrouching) {
    sx = 1.08;
    sy = 0.72;
  }
  const fw = Art.w(frame) * s * sx;
  const fh = Art.h(frame) * s * sy;
  let by = bottom;
  if (p.isFluttering) by += Math.sin(now / 35) * 2; // 아기 용 날갯짓
  if (p.character === 'peach' && p.isGliding) by += Math.sin(now / 120) * 1.5; // 꽃요정 둥실

  // 회전 공격
  const spin = p.attackSpinTimer || 0;
  if (spin > 0) {
    const ang = ((18 - spin) / 18) * Math.PI * 4;
    ctx.translate(cx, by - fh / 2);
    ctx.rotate(ang * dir);
    ctx.translate(-cx, -(by - fh / 2));
  }

  const headY = by - fh + H.head * fh;
  const headX = cx + dir * H.headX * fw;

  // 나뭇잎 망토(활공 파워업): 몸 뒤에
  if (p.powerUp === 'squirrel') {
    const gliding = p.isGliding || !p.isGrounded;
    const capeW = targetH * (gliding ? 0.95 : 0.62);
    ctx.save();
    ctx.translate(cx - dir * fw * 0.16, by - fh * (gliding ? 0.62 : 0.45));
    if (gliding) ctx.rotate(dir * -0.5);
    Art.center(ctx, 'leaf_cape', 0, 0, capeW, flip);
    ctx.restore();
  }

  Art.rect(ctx, frame, cx - fw / 2, by - fh, fw, fh, flip, fireTint(p));

  // 바람개비 모자 / 가시 투구: 머리 위에
  if (p.powerUp === 'propeller') {
    const spinning = p.isPropellerSpinning;
    const capW = targetH * 0.5;
    const capFlip = spinning ? Math.floor(now / 50) % 2 === 0 : flip;
    const capH = Art.center(ctx, 'pinwheel_cap', headX, headY - 2 + (spinning ? Math.sin(now / 40) : 0), capW, capFlip);
    void capH;
  } else if (p.powerUp === 'spiny_helmet') {
    Art.center(ctx, 'spike_helmet', headX, headY + 2, targetH * 0.5, flip);
  }

  drawCharge(ctx, p, cx, by - fh / 2);

  // 회전 공격 잔상
  if (spin > 0) {
    ctx.strokeStyle = 'rgba(255, 230, 100, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, by - fh / 2, fw * 0.75, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  return true;
}

function fireTint(p: Player): string | undefined {
  return p.powerUp === 'fire' ? 'rgba(255, 96, 32, 0.32)' : undefined;
}

function drawCharge(ctx: CanvasRenderingContext2D, p: Player, cx: number, cy: number) {
  if (!p.isCharging || p.vehicle === 'none') return;
  const r = Math.min(1, p.chargeTimer / 45);
  ctx.strokeStyle = '#ff3300';
  ctx.lineWidth = 2 + r * 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 16 + r * 10, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawDeadPlayerArt(ctx: CanvasRenderingContext2D, p: Player): boolean {
  if (!Art.ready()) return false;
  const H = hero(p);
  const name = H.key + '_jump';
  const s = SMALL_H / H.refH;
  ctx.save();
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
  ctx.scale(1, -1); // 거꾸로 뒤집혀 떨어짐
  Art.rect(ctx, name, (-Art.w(name) * s) / 2, (-Art.h(name) * s) / 2, Art.w(name) * s, Art.h(name) * s);
  ctx.restore();
  return true;
}

// ───────────────────────── 블록 ─────────────────────────
const GROUND_SET: Record<string, string> = {
  grassland: 'forest',
  sky: 'forest',
  underground: 'cave',
  canyon: 'canyon',
  mountain: 'snow',
  lava: 'castle',
  boss_castle: 'castle',
};

// 큰 블록은 24칸씩 나눠서 같은 그림을 여러 번 그림 (한 장을 크게 늘리지 않음)
function tiles(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number) {
  const T = 24;
  if (w <= T + 2 && h <= T + 2) {
    Art.rect(ctx, name, x, y, w, h);
    return;
  }
  const [v0, v1] = viewRange(ctx);
  for (let yy = 0; yy < h; yy += T) {
    const rh = Math.min(T, h - yy);
    for (let xx = 0; xx < w; xx += T) {
      if (x + xx + T < v0 || x + xx > v1) continue;
      const cw = Math.min(T, w - xx);
      Art.part(ctx, name, 0, 0, cw / T, rh / T, x + xx, y + yy, cw, rh);
    }
  }
}

// 보이는 화면 범위(월드 좌표): 아주 긴 땅을 그릴 때 화면 밖 칸은 건너뜀
function viewRange(ctx: CanvasRenderingContext2D): [number, number] {
  const m = ctx.getTransform();
  const left = -m.e / m.a;
  return [left - 48, left + ctx.canvas.width / m.a + 48];
}

export function drawBlockArt(ctx: CanvasRenderingContext2D, b: Block, now: number, theme: string): boolean {
  if (!Art.ready()) return false;
  const x = Math.floor(b.x);
  const y = Math.floor(b.y + b.bumpOffset);
  const w = b.width;
  const h = b.height;
  const T = 24;

  switch (b.type) {
    case 'ground': {
      const set = GROUND_SET[theme] || 'forest';
      const top = `g_${set}_top`;
      const fill = `g_${set}_fill`;
      const [v0, v1] = viewRange(ctx);
      const cx0 = Math.max(0, Math.floor((v0 - x) / T));
      const cx1 = Math.min(Math.ceil(w / T), Math.ceil((v1 - x) / T));
      for (let row = 0; row * T < h; row++) {
        const ty = y + row * T;
        const rh = Math.min(T, h - row * T);
        for (let col = cx0; col < cx1; col++) {
          const tx = x + col * T;
          const cw = Math.min(T, w - col * T);
          if (row === 0) {
            // 윗줄: 풀·눈이 칸 위로 살짝 솟음
            const th = (Art.h(top) * T) / Art.w(top);
            Art.part(ctx, top, 0, 0, cw / T, 1, tx, ty + T - th, cw, th);
          } else {
            Art.part(ctx, fill, 0, 0, cw / T, rh / T, tx, ty, cw, rh);
          }
        }
      }
      return true;
    }
    case 'brick':
      tiles(ctx, 'blk_brick', x, y, w, h);
      return true;
    case 'question':
      Art.rect(ctx, 'blk_star', x, y, w, h);
      // 반짝반짝
      if (Math.floor(now / 400) % 3 === 0) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 3, y + 3, w - 6, 3);
        ctx.restore();
      }
      return true;
    case 'question_used':
      Art.rect(ctx, 'blk_used', x, y, w, h);
      return true;
    case 'hard_block':
      tiles(ctx, 'blk_crate', x, y, w, h);
      return true;
    case 'pipe_top_left':
    case 'pipe_top_right':
    case 'pipe_body_left':
    case 'pipe_body_right': {
      // 속이 빈 통나무 관: 왼쪽 칸은 그림의 왼쪽 반, 오른쪽 칸은 오른쪽 반
      const left = b.type.includes('left');
      const isTop = b.type.includes('top');
      const name = isTop ? 'log_top' : 'log_body';
      const fx0 = left ? 0 : 0.5;
      const fx1 = left ? 0.5 : 1;
      if (isTop) {
        Art.part(ctx, name, fx0, 0, fx1, 1, x, y, w, h);
      } else {
        for (let yy = 0; yy < h; yy += T) {
          const rh = Math.min(T, h - yy);
          Art.part(ctx, name, fx0, 0, fx1, rh / T, x, y + yy, w, rh);
        }
      }
      return true;
    }
    case 'cloud_platform':
      Art.sliced(ctx, 'cloud', x - 2, y - 2, w + 4, Math.max(h, 18) + 6, 0.2);
      return true;
    case 'moving_platform':
      Art.sliced(ctx, 'plank', x, y, w, Math.max(h, 12), 0.15);
      return true;
    case 'note_block':
      Art.rect(ctx, 'drum', x, y - 4, w, h + 4);
      return true;
    case 'spikes':
      for (let xx = 0; xx < w; xx += T) {
        const cw = Math.min(T, w - xx);
        Art.part(ctx, 'spikes', 0, 0, cw / T, 1, x + xx, y, cw, h);
      }
      return true;
    case 'lava': {
      // 부글부글 용암: 천천히 옆으로 흐름
      const shift = Math.floor((now / 90) % T);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      for (let yy = 0; yy < h; yy += T) {
        for (let xx = -T; xx < w; xx += T) {
          Art.rect(ctx, 'g_lava', x + xx + shift, y + yy + Math.sin((now + xx * 13) / 220) * 1.5, T, T);
        }
      }
      ctx.restore();
      return true;
    }
    case 'flagpole': {
      // 받침 + 나무 깃대 + 초록 나뭇잎 깃발
      Art.rect(ctx, 'blk_brick', x + 1, y + h - 16, w - 2, 16);
      const poleW = 8;
      Art.part(ctx, 'pole', 0, 0.2, 1, 1, x + w / 2 - poleW / 2, y, poleW, h - 16);
      const fy = b.flagY !== undefined ? b.flagY : y + 6;
      const wave = Math.sin((now + x) / 160) * 0.06;
      const fw = 28;
      const fh = (fw * Art.h('flag')) / Art.w('flag');
      ctx.save();
      ctx.translate(x + w / 2 + 1, fy);
      ctx.rotate(wave);
      Art.rect(ctx, 'flag', -fw, 0, fw, fh);
      ctx.restore();
      // 꼭대기 금색 공
      Art.part(ctx, 'pole', 0, 0, 1, 0.22, x + w / 2 - 8, y - 12, 16, 16);
      return true;
    }
    case 'flag_top':
      Art.part(ctx, 'pole', 0, 0, 1, 0.22, x + w / 2 - 8, y, 16, 16);
      return true;
    case 'castle_axe': {
      const lw = Math.max(w, 28);
      const lh = (lw * Art.h('lever')) / Art.w('lever');
      Art.rect(ctx, 'lever', x + w / 2 - lw / 2, y + h - lh, lw, lh);
      return true;
    }
    case 'bridge_chain':
      for (let xx = 0; xx < w; xx += T) {
        const cw = Math.min(T, w - xx);
        Art.part(ctx, 'g_bridge', 0, 0, cw / T, 1, x + xx, y, cw, Math.min(h, T));
      }
      return true;
  }
  return false;
}

// ───────────────────────── 적 ─────────────────────────
export function drawEnemyArt(ctx: CanvasRenderingContext2D, e: Enemy, now: number): boolean {
  if (!Art.ready()) return false;
  if (e.isDead && e.deathTimer <= 0) return true;
  const cx = e.x + e.width / 2;
  const bottom = e.y + e.height;
  const flip = e.facing === 'left';
  const t = now + e.x * 7; // 적마다 움직임 박자를 조금씩 다르게

  switch (e.type) {
    case 'goomba': {
      // 보라 젤리 슬라임
      if (e.isDead) {
        Art.foot(ctx, 'slime_flat', cx, bottom + 1, 32 / 69);
      } else {
        // 말랑말랑 눌렸다 늘어났다 하며 통통 튐
        const k = Math.sin(t / 130);
        const sw = (30 / 54) * (1 + 0.1 * k);
        const sh = (30 / 54) * (1 - 0.1 * k);
        const lift = k < 0 ? -k * 3 : 0;
        const w = 54 * sw;
        const h = 36 * sh;
        Art.rect(ctx, 'slime_1', cx - w / 2, bottom + 1 - lift - h, w, h, flip);
      }
      return true;
    }
    case 'koopa_green':
    case 'koopa_red': {
      const red = e.type === 'koopa_red';
      const f = Math.floor(t / 220) % 2 === 0;
      const name = red ? (f ? 'snail_r1' : 'snail_r2') : f ? 'snail_g1' : 'snail_g2';
      Art.foot(ctx, name, cx, bottom + 1, 32 / 55, flip);
      return true;
    }
    case 'koopa_shell': {
      const name = e.shellRed ? 'shell_r' : 'shell_g';
      const spinFlip = e.isShellSpinning ? Math.floor(now / 60) % 2 === 0 : flip;
      Art.foot(ctx, name, cx, bottom + 1, 26 / 45, spinFlip);
      return true;
    }
    case 'piranha_plant': {
      // 파랑 덥석꽃: 통나무 관 위로만 보이게 자름
      const open = Math.floor(t / 300) % 2 === 0;
      ctx.save();
      const cutY = (e.pipeTopY ?? e.y) + e.height;
      ctx.beginPath();
      ctx.rect(e.x - 30, cutY - 400, e.width + 60, 400);
      ctx.clip();
      Art.foot(ctx, open ? 'plant_open' : 'plant_closed', cx, bottom, 36 / 58, flip);
      ctx.restore();
      return true;
    }
    case 'dry_bones': {
      if (e.bonesCrumpledTimer && e.bonesCrumpledTimer > 0) {
        const shake = e.bonesCrumpledTimer < 40 ? Math.sin(now / 30) * 1.5 : 0;
        Art.foot(ctx, 'golem_pile', cx + shake, bottom + 1, 32 / 68);
      } else {
        const step = Math.floor(t / 220) % 2 === 0 ? 0 : -1;
        Art.foot(ctx, 'golem', cx, bottom + 1 + step, 30 / 50, flip);
      }
      return true;
    }
    case 'hammer_bro': {
      const throwing = Math.floor(t / 420) % 2 === 1;
      Art.foot(ctx, throwing ? 'goblin_throw' : 'goblin_raise', cx, bottom + 1, 36 / 50, flip);
      return true;
    }
    case 'bullet_bill': {
      const left = e.vx < 0 || (e.vx === 0 && flip);
      const mw = 38;
      const mh = (mw * Art.h('missile')) / Art.w('missile');
      Art.rect(ctx, 'missile', cx - mw / 2, e.y + e.height / 2 - mh / 2, mw, mh, left);
      return true;
    }
    case 'spiny':
      Art.foot(ctx, 'beetle', cx, bottom + 1, 30 / 49, flip);
      return true;
    case 'bowser':
      drawBossArt(ctx, e, now);
      return true;
  }
  return false;
}

function drawBossArt(ctx: CanvasRenderingContext2D, e: Enemy, now: number) {
  const phase = e.bossPhase || 1;
  const enraged = phase >= 2;
  const fury = phase === 3;
  const cx = e.x + e.width / 2;
  const bottom = e.y + e.height;
  const flip = e.facing === 'left';
  const roar = (e.fireChargeTimer || 0) > 0 || (e.animTimer || 0) % 90 > 70;
  const name = (e.hurtFlash || 0) > 0 ? 'boss_hurt' : roar ? 'boss_roar' : 'boss_stand';

  ctx.save();
  if (e.isFallingInLava) {
    ctx.translate(cx, bottom);
    ctx.rotate((Math.sin(now / 50) * 15 * Math.PI) / 180);
    ctx.translate(-cx, -bottom);
  }
  if (fury) {
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 14 + Math.sin(now / 80) * 6;
  } else if (enraged) {
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 8;
  }
  const s = 84 / 109;
  const drawn = Art.foot(ctx, name, cx, bottom + 2, s, flip);
  if ((e.hurtFlash || 0) > 0 && Math.floor(now / 60) % 2 === 0) {
    // 맞았을 때 하얗게 번쩍
    ctx.globalAlpha = 0.45;
    Art.rect(ctx, name, cx - drawn.w / 2, bottom + 2 - drawn.h, drawn.w, drawn.h, flip, 'rgba(255,255,255,1)');
    ctx.globalAlpha = 1;
  }
  ctx.shadowBlur = 0;

  // 체력 막대
  if (e.health !== undefined && e.maxHealth) {
    const barW = 60;
    const barH = 6;
    const barX = cx - barW / 2;
    const barY = bottom - drawn.h - 12;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    const ratio = Math.max(0, e.health / e.maxHealth);
    ctx.fillStyle = fury ? '#ff1100' : enraged ? '#ff8800' : '#22cc44';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * ratio, barH - 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX + barW * 0.33, barY, 1, barH);
    ctx.fillRect(barX + barW * 0.66, barY, 1, barH);
    ctx.fillStyle = fury ? '#ff3300' : '#ffd700';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(fury ? 'PHASE 3: FURY' : enraged ? 'PHASE 2: ANGRY' : 'LAVA KING', cx, barY - 3);
  }
  ctx.restore();
}

// ───────────────────────── 아이템 ─────────────────────────
const ITEM_ART: Record<string, [string, number]> = {
  super_mushroom: ['berry', 22],
  '1up_mushroom': ['heart', 24],
  fire_flower: ['chili', 24],
  propeller_mushroom: ['pinwheel_cap', 24],
  super_acorn: ['leaf_cape', 26],
  spiny_shell: ['spike_helmet', 26],
  starman: ['star', 24],
  yoshi_egg: ['egg', 22],
  clown_car: ['cup_fire', 30],
  dry_bones_shell: ['stone_shell', 30],
};

export function drawItemArt(ctx: CanvasRenderingContext2D, item: ItemEntity, now: number): boolean {
  if (!Art.ready()) return false;
  const cx = item.x + item.width / 2;
  const bottom = item.y + item.height;
  if (item.type === 'coin') {
    // 빙글빙글 도는 금화
    const spin = Math.abs(Math.sin(now / 160 + item.x));
    const cw = 18 * Math.max(0.15, spin);
    Art.rect(ctx, 'coin', cx - cw / 2, item.y + item.height / 2 - 9, cw, 18);
    return true;
  }
  const a = ITEM_ART[item.type];
  if (!a) return false;
  const [name, size] = a;
  const glow = item.type === 'starman' ? 1 + Math.sin(now / 120) * 0.06 : 1;
  const s = (size * glow) / Math.max(Art.w(name), Art.h(name));
  Art.foot(ctx, name, cx, bottom + 1, s);
  return true;
}

// ───────────────────────── 날아가는 것 ─────────────────────────
export function drawProjectileArt(ctx: CanvasRenderingContext2D, p: Projectile, now: number): boolean {
  if (!Art.ready()) return false;
  const cx = p.x + p.width / 2;
  const cy = p.y + p.height / 2;
  if (p.type === 'player_fireball') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((now / 60) % (Math.PI * 2));
    Art.center(ctx, 'fireball', 0, 0, Math.max(12, p.width + 4));
    ctx.restore();
    return true;
  }
  if (p.type === 'charge_fireball' || p.type === 'bowser_fire') {
    // 그림은 왼쪽으로 날아가는 모습 → 오른쪽으로 갈 때 뒤집기
    const w = Math.max(18, p.width * 1.5);
    Art.center(ctx, 'lava_ball', cx, cy, w, p.vx > 0);
    return true;
  }
  if (p.type === 'hammer') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((now * 0.015) % (Math.PI * 2));
    Art.center(ctx, 'mallet', 0, 0, 16);
    ctx.restore();
    return true;
  }
  return false;
}
