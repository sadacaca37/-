import * as THREE from "three";
import { CharacterPreset } from "../types";

// Classic blocky-humanoid character model with pixel-art skins.
// Proportions (in blocks): head 0.5 cube, body 0.5 x 0.75 x 0.25,
// arms & legs 0.25 x 0.75 x 0.25 — total height 1.8, the same as the
// player's hitbox. Every face is an 8px-per-block pixel texture drawn on a
// canvas at load time, so no image files are needed.

type Grid = string[][]; // rows of hex colors ("" = transparent / skip)

const PX_PER_BLOCK = 16; // texture pixels per 1.0 world unit (head = 8 px wide)

// Deterministic per-pixel shade variation so flat colors read as "textured".
function hash(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 982451653) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function shade(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amount);
  return "#" + c.getHexString();
}

function fill(w: number, h: number, color: string): Grid {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => color));
}

function put(g: Grid, x: number, y: number, color: string) {
  if (g[y] && x >= 0 && x < g[y].length) g[y][x] = color;
}

function row(g: Grid, y: number, color: string, x0 = 0, x1 = g[0].length - 1) {
  for (let x = x0; x <= x1; x++) put(g, x, y, color);
}

// ---------- Face painters ----------

interface Palette {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  acc: string;
  eye: string;
  shoe: string;
}

function paletteFor(p: CharacterPreset): Palette {
  return {
    skin: p.skinColor,
    hair: p.hairColor,
    shirt: p.shirtColor,
    pants: p.pantsColor,
    acc: p.accessoryColor || p.hairColor,
    eye: p.id === 1 ? "#67e8f9" : p.id === 3 ? "#f87171" : "#1e293b",
    shoe: shade(p.pantsColor, -0.12),
  };
}

// Head: 8x8 per face
function headFront(p: CharacterPreset, c: Palette): Grid {
  const g = fill(8, 8, c.skin);
  // hair line
  row(g, 0, c.hair);
  row(g, 1, c.hair);
  if (p.id === 2) {
    // hood: covers rows 0-2 and the outer columns
    row(g, 2, c.acc);
    for (let y = 0; y < 8; y++) {
      put(g, 0, y, c.acc);
      put(g, 7, y, c.acc);
    }
    row(g, 0, c.acc);
    row(g, 1, c.acc);
  } else if (p.id === 3) {
    // cap with brim
    row(g, 0, c.acc);
    row(g, 1, c.acc);
    row(g, 2, shade(c.acc, -0.1));
  } else if (p.id === 0) {
    // fringe
    put(g, 1, 2, c.hair);
    put(g, 5, 2, c.hair);
    put(g, 6, 2, c.hair);
  }
  // eyes
  const eyeRow = p.id === 1 ? 4 : 4;
  if (p.id === 1) {
    // robot visor
    row(g, 3, shade(c.acc, -0.25), 1, 6);
    row(g, 4, c.eye, 1, 6);
    put(g, 3, 4, shade(c.eye, -0.3));
    put(g, 4, 4, shade(c.eye, -0.3));
  } else {
    put(g, 1, eyeRow, "#ffffff");
    put(g, 2, eyeRow, c.eye);
    put(g, 5, eyeRow, c.eye);
    put(g, 6, eyeRow, "#ffffff");
  }
  // nose / mouth
  if (p.id !== 1) {
    put(g, 3, 5, shade(c.skin, -0.12));
    put(g, 4, 5, shade(c.skin, -0.12));
    put(g, 3, 6, shade(c.skin, -0.2));
    put(g, 4, 6, shade(c.skin, -0.2));
  } else {
    row(g, 6, shade(c.skin, -0.2), 2, 5);
    put(g, 3, 6, c.eye);
    put(g, 4, 6, c.eye);
  }
  return g;
}

function headSide(p: CharacterPreset, c: Palette): Grid {
  const g = fill(8, 8, c.skin);
  row(g, 0, c.hair);
  row(g, 1, c.hair);
  row(g, 2, c.hair, 4, 7);
  if (p.id === 2) {
    for (let y = 0; y < 8; y++) row(g, y, c.acc, 3, 7);
    row(g, 0, c.acc);
    row(g, 1, c.acc);
  } else if (p.id === 3) {
    row(g, 0, c.acc);
    row(g, 1, c.acc);
  } else if (p.id === 1) {
    row(g, 4, shade(c.acc, -0.2), 0, 1);
    put(g, 2, 3, shade(c.skin, -0.15));
    put(g, 2, 5, shade(c.skin, -0.15));
  }
  // ear
  if (p.id === 0 || p.id === 2) {
    put(g, 1, 4, shade(c.skin, -0.08));
    put(g, 1, 5, shade(c.skin, -0.08));
  }
  return g;
}

function headBack(p: CharacterPreset, c: Palette): Grid {
  const g = fill(8, 8, c.hair);
  if (p.id === 2) return fill(8, 8, c.acc);
  if (p.id === 3) {
    row(g, 0, c.acc);
    row(g, 1, c.acc);
  }
  if (p.id === 1) {
    const m = fill(8, 8, c.skin);
    row(m, 3, shade(c.skin, -0.2), 2, 5);
    row(m, 5, shade(c.skin, -0.2), 2, 5);
    return m;
  }
  return g;
}

function headTop(p: CharacterPreset, c: Palette): Grid {
  if (p.id === 2 || p.id === 3) return fill(8, 8, c.acc);
  if (p.id === 1) {
    const g = fill(8, 8, c.skin);
    put(g, 3, 3, shade(c.skin, -0.25));
    put(g, 4, 3, shade(c.skin, -0.25));
    put(g, 3, 4, shade(c.skin, -0.25));
    put(g, 4, 4, shade(c.skin, -0.25));
    return g;
  }
  return fill(8, 8, c.hair);
}

function headBottom(_p: CharacterPreset, c: Palette): Grid {
  return fill(8, 8, shade(c.skin, -0.1));
}

// Body: 8x12 front/back, 4x12 sides, 8x4 top/bottom
function bodyFront(p: CharacterPreset, c: Palette, accent: string): Grid {
  const g = fill(8, 12, c.shirt);
  // collar
  put(g, 3, 0, c.skin);
  put(g, 4, 0, c.skin);
  // belt with room accent color
  row(g, 10, accent);
  row(g, 11, c.pants);
  if (p.id === 1) {
    // chest panel
    row(g, 3, shade(c.shirt, -0.2), 2, 5);
    row(g, 6, shade(c.shirt, -0.2), 2, 5);
    put(g, 2, 4, shade(c.shirt, -0.2));
    put(g, 5, 4, shade(c.shirt, -0.2));
    put(g, 2, 5, shade(c.shirt, -0.2));
    put(g, 5, 5, shade(c.shirt, -0.2));
    put(g, 3, 4, c.eye);
    put(g, 4, 5, c.eye);
  } else if (p.id === 2) {
    // leaf tunic V-neck
    row(g, 1, shade(c.shirt, -0.2), 2, 5);
    row(g, 2, shade(c.shirt, -0.2), 3, 4);
    for (let y = 4; y < 10; y += 2) {
      put(g, 1, y, shade(c.shirt, 0.12));
      put(g, 6, y + 1, shade(c.shirt, 0.12));
    }
  } else if (p.id === 3) {
    // chest plate
    for (let y = 2; y < 9; y++) row(g, y, shade(c.shirt, -0.08), 1, 6);
    row(g, 4, shade(c.shirt, -0.25), 2, 5);
    row(g, 7, shade(c.shirt, -0.25), 2, 5);
  } else {
    // pocket + stripe
    row(g, 5, shade(c.shirt, -0.15), 1, 2);
    row(g, 6, shade(c.shirt, -0.15), 1, 2);
  }
  return g;
}

function bodyBack(_p: CharacterPreset, c: Palette, accent: string): Grid {
  const g = fill(8, 12, c.shirt);
  row(g, 10, accent);
  row(g, 11, c.pants);
  return g;
}

function bodySide(_p: CharacterPreset, c: Palette, accent: string): Grid {
  const g = fill(4, 12, c.shirt);
  row(g, 10, accent);
  row(g, 11, c.pants);
  return g;
}

function bodyTop(_p: CharacterPreset, c: Palette): Grid {
  return fill(8, 4, c.shirt);
}

function bodyBottom(_p: CharacterPreset, c: Palette): Grid {
  return fill(8, 4, c.pants);
}

// Arm: 4x12 per side face, 4x4 top/bottom
function armFace(p: CharacterPreset, c: Palette): Grid {
  const g = fill(4, 12, c.shirt);
  // short sleeve: skin from row 5 down (robot & warrior keep long sleeves)
  if (p.id === 0 || p.id === 2) {
    for (let y = 5; y < 12; y++) row(g, y, c.skin);
  } else if (p.id === 1) {
    row(g, 5, shade(c.shirt, -0.2));
    row(g, 9, shade(c.shirt, -0.2));
    for (let y = 10; y < 12; y++) row(g, y, shade(c.skin, -0.1));
  } else {
    row(g, 4, shade(c.shirt, -0.25));
    for (let y = 10; y < 12; y++) row(g, y, c.skin);
  }
  return g;
}

function armTop(_p: CharacterPreset, c: Palette): Grid {
  return fill(4, 4, c.shirt);
}

function armBottom(_p: CharacterPreset, c: Palette): Grid {
  return fill(4, 4, c.skin);
}

// Leg: 4x12 per side face
function legFace(p: CharacterPreset, c: Palette): Grid {
  const g = fill(4, 12, c.pants);
  row(g, 10, c.shoe);
  row(g, 11, c.shoe);
  if (p.id === 1) row(g, 6, shade(c.pants, -0.2));
  if (p.id === 3) row(g, 7, shade(c.pants, -0.2));
  return g;
}

function legTop(_p: CharacterPreset, c: Palette): Grid {
  return fill(4, 4, c.pants);
}

function legBottom(_p: CharacterPreset, c: Palette): Grid {
  return fill(4, 4, c.shoe);
}

// ---------- Grid -> texture ----------

function gridToTexture(g: Grid, salt: number): THREE.CanvasTexture {
  const h = g.length;
  const w = g[0].length;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const base = g[y][x];
      if (!base) continue;
      // subtle noise so large flat areas don't look plastic
      const n = (hash(x, y, salt) - 0.5) * 0.07;
      ctx.fillStyle = shade(base, n);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  return tex;
}

function mat(g: Grid, salt: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ map: gridToTexture(g, salt) });
}

// BoxGeometry material order: +x, -x, +y, -y, +z, -z  (right, left, top, bottom, front, back)
function boxMats(
  right: Grid,
  left: Grid,
  top: Grid,
  bottom: Grid,
  front: Grid,
  back: Grid,
  salt: number
): THREE.Material[] {
  return [
    mat(right, salt + 1),
    mat(left, salt + 2),
    mat(top, salt + 3),
    mat(bottom, salt + 4),
    mat(front, salt + 5),
    mat(back, salt + 6),
  ];
}

// ---------- Public API ----------

export interface CharacterModel {
  group: THREE.Group;
  head: THREE.Object3D; // pivot at neck — rotate .x for pitch
  torso: THREE.Mesh;
  leftArm: THREE.Object3D; // pivot at shoulder
  rightArm: THREE.Object3D; // pivot at shoulder; holds handAnchor
  leftLeg: THREE.Object3D; // pivot at hip
  rightLeg: THREE.Object3D;
  handAnchor: THREE.Object3D; // where a held block attaches
  height: number;
}

/**
 * Build a blocky humanoid with pixel-art skin for the given preset.
 * `accentColor` (the room-assigned per-player color) is painted as the belt,
 * so two players using the same character are still telling apart.
 */
export function createCharacterModel(preset: CharacterPreset, accentColor: string): CharacterModel {
  const c = paletteFor(preset);
  const salt = preset.id * 97;

  const HEAD = 0.5;
  const BODY_W = 0.5, BODY_H = 0.75, BODY_D = 0.25;
  const LIMB_W = 0.25, LIMB_H = 0.75;

  const group = new THREE.Group();

  // Legs (pivot at hip, mesh hangs down)
  const legGeo = new THREE.BoxGeometry(LIMB_W, LIMB_H, LIMB_W);
  const makeLeg = (x: number, s: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, LIMB_H, 0);
    const m = new THREE.Mesh(
      legGeo,
      boxMats(legFace(preset, c), legFace(preset, c), legTop(preset, c), legBottom(preset, c), legFace(preset, c), legFace(preset, c), salt + s)
    );
    m.position.y = -LIMB_H / 2;
    pivot.add(m);
    return pivot;
  };
  const leftLeg = makeLeg(-LIMB_W / 2, 10);
  const rightLeg = makeLeg(LIMB_W / 2, 20);
  group.add(leftLeg, rightLeg);

  // Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(BODY_W, BODY_H, BODY_D),
    boxMats(
      bodySide(preset, c, accentColor),
      bodySide(preset, c, accentColor),
      bodyTop(preset, c),
      bodyBottom(preset, c),
      bodyFront(preset, c, accentColor),
      bodyBack(preset, c, accentColor),
      salt + 30
    )
  );
  torso.position.y = LIMB_H + BODY_H / 2;
  group.add(torso);

  // Arms (pivot at shoulder)
  const armGeo = new THREE.BoxGeometry(LIMB_W, LIMB_H, LIMB_W);
  const makeArm = (x: number, s: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, LIMB_H + BODY_H - 0.06, 0);
    const m = new THREE.Mesh(
      armGeo,
      boxMats(armFace(preset, c), armFace(preset, c), armTop(preset, c), armBottom(preset, c), armFace(preset, c), armFace(preset, c), salt + s)
    );
    m.position.y = -LIMB_H / 2 + 0.06;
    pivot.add(m);
    return pivot;
  };
  const leftArm = makeArm(-(BODY_W / 2 + LIMB_W / 2), 40);
  const rightArm = makeArm(BODY_W / 2 + LIMB_W / 2, 50);
  group.add(leftArm, rightArm);

  const handAnchor = new THREE.Object3D();
  handAnchor.position.set(0, -LIMB_H + 0.12, 0.18);
  rightArm.add(handAnchor);

  // Head (pivot at neck)
  const head = new THREE.Group();
  head.position.y = LIMB_H + BODY_H;
  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(HEAD, HEAD, HEAD),
    boxMats(
      headSide(preset, c),
      headSide(preset, c),
      headTop(preset, c),
      headBottom(preset, c),
      headFront(preset, c),
      headBack(preset, c),
      salt + 60
    )
  );
  headMesh.position.y = HEAD / 2;
  head.add(headMesh);
  // Hat layer: slightly bigger transparent-free shell for hood/cap presets to add depth
  if (preset.accessory === "hood" || preset.accessory === "cap") {
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(HEAD + 0.06, preset.accessory === "hood" ? HEAD + 0.06 : 0.14, HEAD + 0.06),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(c.acc) })
    );
    shell.position.y = preset.accessory === "hood" ? HEAD / 2 : HEAD - 0.05;
    if (preset.accessory === "hood") shell.position.z = -0.03;
    head.add(shell);
    if (preset.accessory === "cap") {
      const brim = new THREE.Mesh(
        new THREE.BoxGeometry(HEAD + 0.06, 0.05, 0.16),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(c.acc) })
      );
      brim.position.set(0, HEAD - 0.1, HEAD / 2 + 0.06);
      head.add(brim);
    }
  }
  group.add(head);

  return {
    group,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    handAnchor,
    height: LIMB_H + BODY_H + HEAD,
  };
}

/**
 * 2D front-view preview of the same skin, for the character-select screen.
 * Draws at `px` screen pixels per skin pixel with crisp edges.
 */
export function drawCharacterPreview(canvas: HTMLCanvasElement, preset: CharacterPreset, accentColor: string, px = 6) {
  const c = paletteFor(preset);
  const head = headFront(preset, c);
  const body = bodyFront(preset, c, accentColor);
  const arm = armFace(preset, c);
  const leg = legFace(preset, c);

  // Layout in skin pixels: total width 16 (arm 4 + body 8 + arm 4), height 32
  canvas.width = 16 * px;
  canvas.height = 32 * px;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const blit = (g: Grid, ox: number, oy: number, salt: number) => {
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[y].length; x++) {
        const base = g[y][x];
        if (!base) continue;
        const n = (hash(x, y, salt) - 0.5) * 0.07;
        ctx.fillStyle = shade(base, n);
        ctx.fillRect((ox + x) * px, (oy + y) * px, px, px);
      }
    }
  };

  blit(head, 4, 0, 1);
  blit(body, 4, 8, 2);
  blit(arm, 0, 8, 3);
  blit(arm, 12, 8, 4);
  blit(leg, 4, 20, 5);
  blit(leg, 8, 20, 6);

  // hat/hood overhang for depth in the preview
  if (preset.accessory === "cap") {
    ctx.fillStyle = c.acc;
    ctx.fillRect(3 * px, 2 * px, 10 * px, px * 0.6);
  }
}
