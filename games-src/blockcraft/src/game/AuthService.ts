import { UserAccount, BlockType } from "../types";

const TOKEN_KEY = "minecraft_auth_token";
const USER_KEY = "minecraft_auth_user";
const ACCOUNTS_KEY = "blockcraft_local_accounts";
const SAVE_PREFIX = "blockcraft_world_";

export class AuthService {
  private user: UserAccount | null = null;

  constructor() {
    this.loadFromStorage();
  }

  /** 타자팡팡에 로그인한 학생이면 그 이름으로 자동 로그인 (같은 사이트라 localStorage 공유) */
  private loadFromStorage() {
    try {
      const raw = localStorage.getItem("typang_current_user");
      if (raw) {
        const u = JSON.parse(raw);
        const name = String(u?.name || u?.nickname || u?.studentId || "").trim();
        const id = String(u?.id || u?.studentId || name);
        if (name) {
          this.user = { id: `typang_${id}`, username: name, token: "typang" };
          return;
        }
      }
    } catch {}
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      if (token && userJson) {
        const parsed = JSON.parse(userJson);
        this.user = { ...parsed, token };
      }
    } catch {}
  }

  public getUser(): UserAccount | null {
    return this.user;
  }

  public getCurrentUser(): UserAccount | null {
    return this.user;
  }

  public getToken(): string | null {
    return this.user?.token || localStorage.getItem(TOKEN_KEY);
  }

  public async checkSession(): Promise<UserAccount | null> {
    return this.user;
  }

  private accounts(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  private setUser(username: string) {
    this.user = { id: `local_${username}`, username, token: "local" };
    try {
      localStorage.setItem(TOKEN_KEY, "local");
      localStorage.setItem(USER_KEY, JSON.stringify(this.user));
    } catch {}
    return this.user;
  }

  public async register(username: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const name = (username || "").trim().slice(0, 16);
    if (!name || !password) return { success: false, error: "이름과 비밀번호를 입력해 주세요." };
    const acc = this.accounts();
    if (acc[name]) return { success: false, error: "이미 있는 이름이에요." };
    acc[name] = password;
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(acc));
    } catch {}
    return { success: true, user: this.setUser(name) };
  }

  public async login(username: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const name = (username || "").trim();
    const acc = this.accounts();
    if (!acc[name] || acc[name] !== password) return { success: false, error: "이름 또는 비밀번호가 맞지 않아요." };
    return { success: true, user: this.setUser(name) };
  }

  public async logout(): Promise<void> {
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // --- Auto-Save and Load ---
  public async loadGameData(worldIdOrUsername?: string): Promise<{
    success: boolean;
    player?: { position?: [number, number, number]; health?: number; inventory?: BlockType[] } | null;
    blocks?: Array<{ x: number; y: number; z: number; type: number }>;
    playerData?: any | null;
    worldBlocks?: Record<string, number>;
  }> {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + (worldIdOrUsername || this.user?.username || "guest"));
      const data = raw ? JSON.parse(raw) : null;
      if (data) {
        const blocksList: Array<{ x: number; y: number; z: number; type: number }> = [];
        const wb: Record<string, number> = data.modifiedBlocks || {};
        for (const key of Object.keys(wb)) {
          const [x, y, z] = key.split(",").map(Number);
          blocksList.push({ x, y, z, type: wb[key] });
        }
        const pData = data.playerData;
        return {
          success: true,
          player: pData ? { position: pData.position, health: pData.health, inventory: pData.hotbar || pData.inventory } : null,
          blocks: blocksList,
          playerData: pData || null,
          worldBlocks: wb,
        };
      }
    } catch (err) {
      console.error("Failed to load game data:", err);
    }
    return { success: false, playerData: null, worldBlocks: {} };
  }

  public async savePlayerData(
    username: string,
    position: [number, number, number],
    health: number,
    hotbar: BlockType[],
    modifiedBlocks?: Array<{ x: number; y: number; z: number; type: BlockType }>
  ): Promise<boolean> {
    const blockDict: Record<string, number> = {};
    if (modifiedBlocks) {
      for (const b of modifiedBlocks) {
        blockDict[`${b.x},${b.y},${b.z}`] = b.type;
      }
    }

    return this.saveGameData({
      worldId: username,
      playerData: {
        position,
        rotation: [0, 0],
        health,
        maxHealth: 20,
        activeSlot: 0,
        hotbar,
        inventory: hotbar.map((id) => ({ id, count: 64 })),
      },
      modifiedBlocks: blockDict,
    });
  }

  public async saveGameData(payload: {
    worldId?: string;
    playerData?: {
      position: [number, number, number];
      rotation: [number, number];
      health: number;
      maxHealth: number;
      activeSlot: number;
      hotbar: BlockType[];
      inventory: Array<{ id: number; count: number }>;
    };
    modifiedBlocks?: Record<string, number>;
  }): Promise<boolean> {
    try {
      const key = SAVE_PREFIX + (payload.worldId || this.user?.username || "guest");
      localStorage.setItem(key, JSON.stringify({ ...payload, savedAt: Date.now() }));
      return true;
    } catch (err) {
      console.error("Failed to auto-save game data:", err);
      return false;
    }
  }
}

export const authService = new AuthService();
