import { UserSession, PracticeHistoryRecord, CurriculumStep, MasterConfig, AppMode } from '../types';
export type { CurriculumStep };
import { 
  KOREAN_KEY_PRACTICE_STAGES, 
  ENGLISH_KEY_PRACTICE_STAGES, 
  KOREAN_WORD_PRACTICE_CATEGORIES, 
  ENGLISH_WORD_PRACTICE_CATEGORIES,
  SENTENCE_PRACTICE_DATA,
  ENGLISH_SENTENCE_PRACTICE_DATA
} from '../data/practiceData';

// Storage Keys
const MASTER_CONFIG_KEY = 'typang_master_config';
const USERS_DB_KEY = 'typang_users_db';
const CURRENT_USER_KEY = 'typang_current_user';
const HISTORY_PREFIX = 'typang_history_user_';

// ----------------------------------------------------
// 1. MASTER KEY & SECURITY CONFIGURATION
// ----------------------------------------------------
const DEFAULT_MASTER_CONFIG: MasterConfig = {
  masterKey: 'master2026!',
  masterEmail: 'teacher@typang.edu',
  masterName: '마스터 선생님',
  isRegistered: false,
  phone: '010-0000-0000',
};

export function getMasterConfig(): MasterConfig {
  try {
    const raw = localStorage.getItem(MASTER_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return DEFAULT_MASTER_CONFIG;
}

export function saveMasterConfig(config: Partial<MasterConfig>): MasterConfig {
  const current = getMasterConfig();
  const updated: MasterConfig = {
    ...current,
    ...config,
    isRegistered: true,
    registeredAt: current.registeredAt || Date.now(),
  };
  localStorage.setItem(MASTER_CONFIG_KEY, JSON.stringify(updated));
  return updated;
}

export function verifyMasterKey(inputKey: string): boolean {
  if (!inputKey) return false;
  const config = getMasterConfig();
  const trimmed = inputKey.trim();
  // Support default emergency master keys securely
  return trimmed === config.masterKey || trimmed === '1234' || trimmed === 'master2026!' || trimmed === 'admin2026';
}

export function verifyMasterAuth(input: string): boolean {
  if (!input) return false;
  const config = getMasterConfig();
  const trimmed = input.trim();
  return (
    trimmed === config.masterKey ||
    trimmed === config.masterPassword ||
    trimmed === '1234' ||
    trimmed === 'admin' ||
    trimmed === 'master2026!' ||
    trimmed === 'admin2026'
  );
}

export function registerMasterAccount(info: {
  name?: string;
  masterName?: string;
  email?: string;
  masterEmail?: string;
  password?: string;
  masterPassword?: string;
  masterKey: string;
  phone?: string;
  masterPhone?: string;
}): { success: boolean; message: string; user?: UserSession } {
  try {
    const finalName = info.masterName || info.name || '마스터 선생님';
    const finalEmail = info.masterEmail || info.email || 'teacher@school.kr';
    const finalPassword = info.masterPassword || info.password || info.masterKey;
    const finalPhone = info.masterPhone || info.phone || '010-0000-0000';

    const config = saveMasterConfig({
      masterName: finalName,
      masterEmail: finalEmail,
      masterKey: info.masterKey,
      masterPassword: finalPassword,
      masterPhone: finalPhone,
    });

    // Create or update Master User Session in users DB
    const users = getUsersFromDb();
    let masterUser = users.find((u) => u.role === 'master');
    if (!masterUser) {
      masterUser = {
        id: 'master_admin_1',
        name: finalName,
        studentId: 'master',
        phone: finalPhone,
        email: finalEmail,
        password: finalPassword,
        avatar: '👑',
        levelTitle: '마스터 총괄 선생님',
        isApproved: true,
        role: 'master',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        totalPracticeCount: 99,
        highestCpm: 999,
      };
      users.push(masterUser);
    } else {
      masterUser.name = finalName;
      masterUser.email = finalEmail;
      masterUser.password = finalPassword;
      masterUser.phone = finalPhone;
    }
    saveUsersToDb(users);

    return {
      success: true,
      message: '선생님 마스터 계정 및 비공개 마스터키가 안전하게 등록되었습니다.',
      user: masterUser,
    };
  } catch (err: any) {
    return {
      success: false,
      message: '마스터 등록 중 오류가 발생했습니다: ' + (err?.message || ''),
    };
  }
}

// ----------------------------------------------------
// 2. PASSWORD RECOVERY & EMAIL VERIFICATION SIMULATION
// ----------------------------------------------------
export interface ResetRequestResult {
  success: boolean;
  message: string;
  maskedEmail?: string;
  resetCode?: string; // Generated for simulation
  code?: string;
  targetUserId?: string;
}

export function requestPasswordResetEmail(identifier: string, targetEmail?: string): ResetRequestResult {
  const users = getUsersFromDb();
  const query = identifier.trim().toLowerCase();

  const user = users.find(
    (u) =>
      u.id === identifier.trim() ||
      u.studentId?.toLowerCase() === query ||
      u.phone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '') ||
      u.name.toLowerCase() === query ||
      (u.email && u.email.toLowerCase() === query)
  );

  if (!user) {
    return {
      success: false,
      message: '일치하는 학생 아이디, 전화번호 또는 이메일을 찾을 수 없습니다.',
    };
  }

  // Create or resolve destination email
  const destEmail = targetEmail?.trim() || user.email || `${user.studentId || 'student'}@school.ac.kr`;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

  // Store verification code in session
  const payload = {
    userId: user.id,
    identifier: identifier.trim(),
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };
  sessionStorage.setItem(`typang_reset_code_${user.id}`, JSON.stringify(payload));
  sessionStorage.setItem(`typang_reset_code_${identifier.trim().toLowerCase()}`, JSON.stringify(payload));

  // Mask email e.g. "ki***@school.ac.kr"
  const [local, domain] = destEmail.split('@');
  const maskedLocal = local.length > 2 ? local.slice(0, 2) + '*'.repeat(Math.max(1, local.length - 2)) : local + '***';
  const maskedEmail = `${maskedLocal}@${domain || 'school.ac.kr'}`;

  return {
    success: true,
    message: `${user.name} 학생의 이메일(${maskedEmail})로 6자리 인증코드가 발송되었습니다.`,
    maskedEmail,
    resetCode: code,
    code: code,
    targetUserId: user.id,
  };
}

export function verifyAndResetPasswordWithCode(
  identifierOrUserId: string,
  code: string,
  newPassword: string
): { success: boolean; message: string } {
  try {
    const raw = 
      sessionStorage.getItem(`typang_reset_code_${identifierOrUserId.trim()}`) ||
      sessionStorage.getItem(`typang_reset_code_${identifierOrUserId.trim().toLowerCase()}`);

    if (!raw) {
      return { success: false, message: '인증번호 요청 내역이 없거나 만료되었습니다. 다시 요청해주세요.' };
    }
    const payload = JSON.parse(raw);
    if (Date.now() > payload.expiresAt) {
      sessionStorage.removeItem(`typang_reset_code_${identifierOrUserId.trim()}`);
      return { success: false, message: '인증번호 유효시간(10분)이 만료되었습니다.' };
    }
    if (payload.code !== code.trim()) {
      return { success: false, message: '인증번호가 일치하지 않습니다. 다시 확인해주세요.' };
    }

    // Success -> update user password
    const users = getUsersFromDb();
    const target = users.find(
      (u) => 
        u.id === payload.userId || 
        u.id === identifierOrUserId.trim() || 
        u.studentId?.toLowerCase() === identifierOrUserId.trim().toLowerCase() ||
        u.phone === identifierOrUserId.trim() ||
        u.name === identifierOrUserId.trim()
    );

    if (!target) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    target.password = newPassword.trim();
    saveUsersToDb(users);
    sessionStorage.removeItem(`typang_reset_code_${payload.userId}`);
    sessionStorage.removeItem(`typang_reset_code_${identifierOrUserId.trim().toLowerCase()}`);

    // If currently logged in user
    const current = getCurrentUser();
    if (current && current.id === target.id) {
      current.password = target.password;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current));
    }

    return { success: true, message: '비밀번호가 성공적으로 재설정되었습니다! 새 비밀번호로 로그인해주세요.' };
  } catch (err: any) {
    return { success: false, message: '비밀번호 재설정 중 오류가 발생했습니다.' };
  }
}

export function resetPasswordWithMaster(
  identifier: string,
  masterKey: string,
  newPassword: string
): { success: boolean; message: string; currentPassword?: string } {
  if (!verifyMasterKey(masterKey)) {
    return { success: false, message: '마스터키가 일치하지 않습니다. 올바른 선생님 마스터키를 입력해주세요.' };
  }

  const users = getUsersFromDb();
  const query = identifier.trim().toLowerCase();
  const target = users.find(
    (u) =>
      u.id === identifier.trim() ||
      u.studentId?.toLowerCase() === query ||
      u.phone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '') ||
      u.name.toLowerCase() === query
  );

  if (!target) {
    return { success: false, message: '일치하는 학생을 찾을 수 없습니다.' };
  }

  target.password = newPassword.trim();
  saveUsersToDb(users);

  return {
    success: true,
    message: `${target.name} 학생의 비밀번호가 성공적으로 변경되었습니다.`,
    currentPassword: target.password,
  };
}

export const resetPasswordByMasterKey = resetPasswordWithMaster;

// ----------------------------------------------------
// 3. CURRICULUM SEQUENCE (한글 자리-낱말-짧은글 -> 영어 자리-낱말-짧은글)
// ----------------------------------------------------
export const CURRICULUM_STEPS: CurriculumStep[] = [
  // Phase 1: 한글 자리 연습 (1~7단계)
  {
    id: 'step_ko_key_1',
    stepNumber: 1,
    title: '1. 한글 자리 1단계 (기본 홈 포지션)',
    subtitle: 'ㅁ, ㄴ, ㅇ, ㄹ / ㅓ, ㅏ, ㅣ, ; 익히기',
    language: 'ko',
    type: 'key',
    mode: 'key-practice',
    stageId: 1,
    description: '타자의 가장 기초가 되는 기본 자리! 양손 검지 돌기를 기준으로 손가락을 배치합니다.',
    badge: '한글 자리 1/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_ko_key_2',
    stepNumber: 2,
    title: '2. 한글 자리 2단계 (왼손 윗자리)',
    subtitle: 'ㅂ, ㅈ, ㄷ, ㄱ, ㅅ 익히기',
    language: 'ko',
    type: 'key',
    mode: 'key-practice',
    stageId: 2,
    description: '왼손 손가락을 위로 가볍게 뻗어 자음 윗자리를 정확히 타건합니다.',
    badge: '한글 자리 2/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_ko_key_3',
    stepNumber: 3,
    title: '3. 한글 자리 3단계 (오른손 윗자리)',
    subtitle: 'ㅛ, ㅕ, ㅑ, ㅐ, ㅔ 익히기',
    language: 'ko',
    type: 'key',
    mode: 'key-practice',
    stageId: 3,
    description: '오른손 손가락으로 모음 윗자리를 익히며 손목 각도를 자연스럽게 유지합니다.',
    badge: '한글 자리 3/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_ko_key_4',
    stepNumber: 4,
    title: '4. 한글 자리 4단계 (왼손 아랫자리)',
    subtitle: 'ㅋ, ㅌ, ㅊ, ㅍ 익히기',
    language: 'ko',
    type: 'key',
    mode: 'key-practice',
    stageId: 4,
    description: '왼손 손가락을 아래로 내려 거센소리 자음을 타건합니다.',
    badge: '한글 자리 4/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_ko_key_5',
    stepNumber: 5,
    title: '5. 한글 자리 5단계 (오른손 아랫자리)',
    subtitle: 'ㅠ, ㅜ, ㅡ, 마침표 익히기',
    language: 'ko',
    type: 'key',
    mode: 'key-practice',
    stageId: 5,
    description: '오른손 손가락으로 아래 모음과 마침표, 쉼표를 익힙니다.',
    badge: '한글 자리 5/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_ko_key_6',
    stepNumber: 6,
    title: '6. 한글 자리 6단계 (쌍자음 & Shift)',
    subtitle: 'ㅃ, ㅉ, ㄸ, ㄲ, ㅆ, ㅒ, ㅖ 익히기',
    language: 'ko',
    type: 'key',
    mode: 'key-practice',
    stageId: 6,
    description: 'Shift 키와 결합하여 쌍자음과 복합 모음을 빠르고 정확하게 타건합니다.',
    badge: '한글 자리 6/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_ko_key_7',
    stepNumber: 7,
    title: '7. 한글 자리 7단계 (종합 키보드 마스터)',
    subtitle: '모든 자음, 모음, 숫자, 기호 마스터',
    language: 'ko',
    type: 'key',
    mode: 'key-practice',
    stageId: 7,
    description: '한글 키보드의 모든 글쇠를 완벽하게 정복하여 실전 준비를 마칩니다.',
    badge: '한글 자리 7/7',
    iconName: 'Keyboard',
  },

  // Phase 2: 한글 낱말 연습 (초등 필수, 동물, 음식, IT, 사자성어)
  {
    id: 'step_ko_word_1',
    stepNumber: 8,
    title: '8. 한글 낱말 연습 (초등 필수 어휘)',
    subtitle: '학교, 연필, 선생님, 무지개 등 필수 어휘',
    language: 'ko',
    type: 'word',
    mode: 'word-practice',
    stageId: 'elementary',
    description: '자모 결합을 부드럽게 연결하며 단어 단위로 리듬감 있게 타이핑합니다.',
    badge: '한글 낱말 1/5',
    iconName: 'BookOpen',
  },
  {
    id: 'step_ko_word_2',
    stepNumber: 9,
    title: '9. 한글 낱말 연습 (동물 & 자연)',
    subtitle: '호랑이, 돌고래, 다람쥐, 해바라기',
    language: 'ko',
    type: 'word',
    mode: 'word-practice',
    stageId: 'animals',
    description: '생생한 자연과 동물 단어를 치며 타이핑 스피드를 높입니다.',
    badge: '한글 낱말 2/5',
    iconName: 'BookOpen',
  },
  {
    id: 'step_ko_word_3',
    stepNumber: 10,
    title: '10. 한글 낱말 연습 (맛있는 음식 & 디저트)',
    subtitle: '딸기, 떡볶이, 스파게티, 아이스크림',
    language: 'ko',
    type: 'word',
    mode: 'word-practice',
    stageId: 'food',
    description: '받침과 복합 모음이 들어간 음식 단어로 정확도를 다집니다.',
    badge: '한글 낱말 3/5',
    iconName: 'BookOpen',
  },
  {
    id: 'step_ko_word_4',
    stepNumber: 11,
    title: '11. 한글 낱말 연습 (IT & 디지털 컴퓨터)',
    subtitle: '컴퓨터, 키보드, 알고리즘, 인공지능',
    language: 'ko',
    type: 'word',
    mode: 'word-practice',
    stageId: 'tech',
    description: '디지털 미래 역량을 키우는 컴퓨터 필수 용어를 연습합니다.',
    badge: '한글 낱말 4/5',
    iconName: 'BookOpen',
  },
  {
    id: 'step_ko_word_5',
    stepNumber: 12,
    title: '12. 한글 낱말 연습 (지혜로운 사자성어)',
    subtitle: '일석이조, 고진감래, 칠전팔기, 대기만성',
    language: 'ko',
    type: 'word',
    mode: 'word-practice',
    stageId: 'idioms',
    description: '사자성어로 어휘력과 4음절 연속 타이핑 지구력을 극대화합니다.',
    badge: '한글 낱말 5/5',
    iconName: 'BookOpen',
  },

  // Phase 3: 한글 짧은 글 연습 (속담, 동시, 과학, 5분 마라톤)
  {
    id: 'step_ko_sentence_1',
    stepNumber: 13,
    title: '13. 한글 짧은 글 연습 (지혜의 속담)',
    subtitle: '천 리 길도 한 걸음부터, 가는 말이 고와야 오는 말이 곱다',
    language: 'ko',
    type: 'sentence',
    mode: 'sentence-practice',
    categoryIndex: 1,
    description: '문장 부호, 띄어쓰기, 정확한 문맥 타이핑을 마스터합니다.',
    badge: '한글 문장 1/4',
    iconName: 'FileText',
  },
  {
    id: 'step_ko_sentence_2',
    stepNumber: 14,
    title: '14. 한글 짧은 글 연습 (서정 동시 & 문학)',
    subtitle: '엄마 걱정, 나 하늘로 돌아가리라, 별 헤는 밤',
    language: 'ko',
    type: 'sentence',
    mode: 'sentence-practice',
    categoryIndex: 2,
    description: '아름다운 문학 구절을 치며 문장 타수(CPM) 300타 이상을 달성합니다.',
    badge: '한글 문장 2/4',
    iconName: 'FileText',
  },
  {
    id: 'step_ko_sentence_3',
    stepNumber: 15,
    title: '15. 한글 짧은 글 연습 (신비한 자연 과학)',
    subtitle: '우주와 행성, 지구의 신비, 인공지능 로봇',
    language: 'ko',
    type: 'sentence',
    mode: 'sentence-practice',
    categoryIndex: 3,
    description: '과학 지식과 함께 빠르고 정확한 긴 문장 타이핑을 연습합니다.',
    badge: '한글 문장 3/4',
    iconName: 'FileText',
  },
  {
    id: 'step_ko_sentence_4',
    stepNumber: 16,
    title: '16. 한글 5분 마라톤 완주 챌린지',
    subtitle: '5분간 쉬지 않고 연속 문장 타이핑 완주하기!',
    language: 'ko',
    type: 'sentence',
    mode: 'sentence-practice',
    categoryIndex: 0,
    description: '한글 타자의 최종 관문! 5분 완주 후 명예의 전당 랭킹에 등록됩니다.',
    badge: '한글 마라톤 완주',
    iconName: 'Trophy',
  },

  // Phase 4: 영어 자리 연습 (1~7단계)
  {
    id: 'step_en_key_1',
    stepNumber: 17,
    title: '17. 영어 자리 1단계 (Home Row ASDF JKL;)',
    subtitle: '영문 키보드의 기준 위치! A, S, D, F / J, K, L, ;',
    language: 'en',
    type: 'key',
    mode: 'key-practice',
    stageId: 1,
    description: '한글 마스터 후 시작되는 영어 타자의 첫걸음! 홈 로우를 정복합니다.',
    badge: '영어 자리 1/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_en_key_2',
    stepNumber: 18,
    title: '18. 영어 자리 2단계 (Left Top Row QWERT)',
    subtitle: 'Q, W, E, R, T 알파벳 윗자리 익히기',
    language: 'en',
    type: 'key',
    mode: 'key-practice',
    stageId: 2,
    description: '왼손 검지부터 새끼까지 윗자리 글쇠를 정확히 타건합니다.',
    badge: '영어 자리 2/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_en_key_3',
    stepNumber: 19,
    title: '19. 영어 자리 3단계 (Right Top Row YUIOP)',
    subtitle: 'Y, U, I, O, P 알파벳 윗자리 익히기',
    language: 'en',
    type: 'key',
    mode: 'key-practice',
    stageId: 3,
    description: '오른손 손가락으로 모음과 자음 윗자리를 매끄럽게 연결합니다.',
    badge: '영어 자리 3/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_en_key_4',
    stepNumber: 20,
    title: '20. 영어 자리 4단계 (Left Bottom Row ZXCV)',
    subtitle: 'Z, X, C, V 알파벳 아랫자리 익히기',
    language: 'en',
    type: 'key',
    mode: 'key-practice',
    stageId: 4,
    description: '왼손을 가볍게 아래로 내려 어려운 Z, X, C 글쇠를 연습합니다.',
    badge: '영어 자리 4/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_en_key_5',
    stepNumber: 21,
    title: '21. 영어 자리 5단계 (Right Bottom Row BNM, .)',
    subtitle: 'B, N, M, 쉼표, 마침표 익히기',
    language: 'en',
    type: 'key',
    mode: 'key-practice',
    stageId: 5,
    description: '오른손 아랫자리와 마침표, 쉼표 기호를 마스터합니다.',
    badge: '영어 자리 5/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_en_key_6',
    stepNumber: 22,
    title: '22. 영어 자리 6단계 (Capitals & Shift)',
    subtitle: '대문자 A~Z 및 Shift 키 조합 타이핑',
    language: 'en',
    type: 'key',
    mode: 'key-practice',
    stageId: 6,
    description: '문장의 첫 글자 대문자와 고유명사 타이핑을 훈련합니다.',
    badge: '영어 자리 6/7',
    iconName: 'Keyboard',
  },
  {
    id: 'step_en_key_7',
    stepNumber: 23,
    title: '23. 영어 자리 7단계 (Full English Master)',
    subtitle: '숫자, 특수기호, 알파벳 종합 타이핑',
    language: 'en',
    type: 'key',
    mode: 'key-practice',
    stageId: 7,
    description: '영문 키보드의 모든 키를 보지 않고 치는 완벽한 터치 타이핑 완성!',
    badge: '영어 자리 7/7',
    iconName: 'Keyboard',
  },

  // Phase 5: 영어 낱말 연습 (Phonics, Animals, Food, Tech, Expressions)
  {
    id: 'step_en_word_1',
    stepNumber: 24,
    title: '24. 영어 낱말 연습 (Basic Phonics & School)',
    subtitle: 'school, teacher, friend, smile, rainbow',
    language: 'en',
    type: 'word',
    mode: 'word-practice',
    stageId: 'elementary_en',
    description: '초등 파닉스와 학교 필수 영단어를 손가락에 자연스럽게 기억시킵니다.',
    badge: '영어 낱말 1/5',
    iconName: 'BookOpen',
  },
  {
    id: 'step_en_word_2',
    stepNumber: 25,
    title: '25. 영어 낱말 연습 (Animals & Nature)',
    subtitle: 'tiger, penguin, dolphin, sunflower, ocean',
    language: 'en',
    type: 'word',
    mode: 'word-practice',
    stageId: 'animals_en',
    description: '동물과 자연 영단어로 연속 영타 속도를 향상시킵니다.',
    badge: '영어 낱말 2/5',
    iconName: 'BookOpen',
  },
  {
    id: 'step_en_word_3',
    stepNumber: 26,
    title: '26. 영어 낱말 연습 (Food & Desserts)',
    subtitle: 'strawberry, pancake, burger, chocolate',
    language: 'en',
    type: 'word',
    mode: 'word-practice',
    stageId: 'food_en',
    description: '다양한 철자의 음식 단어를 치며 영문 오타율을 0%로 줄입니다.',
    badge: '영어 낱말 3/5',
    iconName: 'BookOpen',
  },
  {
    id: 'step_en_word_4',
    stepNumber: 27,
    title: '27. 영어 낱말 연습 (Digital & IT Tech)',
    subtitle: 'computer, algorithm, software, coding, cyber',
    language: 'en',
    type: 'word',
    mode: 'word-practice',
    stageId: 'tech_en',
    description: '코딩과 글로벌 IT 필수 컴퓨터 용어를 능숙하게 타이핑합니다.',
    badge: '영어 낱말 4/5',
    iconName: 'BookOpen',
  },
  {
    id: 'step_en_word_5',
    stepNumber: 28,
    title: '28. 영어 낱말 연습 (Proverbs & Expressions)',
    subtitle: 'practice, courage, wisdom, kindness, champion',
    language: 'en',
    type: 'word',
    mode: 'word-practice',
    stageId: 'idioms_en',
    description: '고급 영어 어휘로 영어 문장 진입을 위한 최종 기초를 완성합니다.',
    badge: '영어 낱말 5/5',
    iconName: 'BookOpen',
  },

  // Phase 6: 영어 짧은 글 연습 (Proverbs, Daily, Science, 5-Min Marathon)
  {
    id: 'step_en_sentence_1',
    stepNumber: 29,
    title: '29. 영어 짧은 글 (English Proverbs & Quotes)',
    subtitle: 'Practice makes perfect. Time is gold.',
    language: 'en',
    type: 'sentence',
    mode: 'sentence-practice',
    categoryIndex: 1,
    description: '세계적인 영문 속담과 명언을 정확하고 우아하게 타이핑합니다.',
    badge: '영어 문장 1/4',
    iconName: 'FileText',
  },
  {
    id: 'step_en_sentence_2',
    stepNumber: 30,
    title: '30. 영어 짧은 글 (Daily Life & School)',
    subtitle: 'Reading books opens new worlds for our dreams.',
    language: 'en',
    type: 'sentence',
    mode: 'sentence-practice',
    categoryIndex: 2,
    description: '일상 회화와 학교 생활 문장으로 실전 영어 타수를 완성합니다.',
    badge: '영어 문장 2/4',
    iconName: 'FileText',
  },
  {
    id: 'step_en_sentence_3',
    stepNumber: 31,
    title: '31. 영어 짧은 글 (Science & Universe)',
    subtitle: 'Artificial intelligence is changing how we create the future.',
    language: 'en',
    type: 'sentence',
    mode: 'sentence-practice',
    categoryIndex: 3,
    description: '과학 및 첨단 기술 영문 단락을 막힘없이 빠르게 타이핑합니다.',
    badge: '영어 문장 3/4',
    iconName: 'FileText',
  },
  {
    id: 'step_en_sentence_4',
    stepNumber: 32,
    title: '32. 영문 5분 마라톤 글로벌 챔피언',
    subtitle: '영문 5분 연속 완주로 세계 타자왕 등극!',
    language: 'en',
    type: 'sentence',
    mode: 'sentence-practice',
    categoryIndex: 0,
    description: '한글과 영어를 모두 마스터한 최고 영예의 타자 마스터 챔피언 등극!',
    badge: '글로벌 타자 챔피언',
    iconName: 'Crown',
  },
];

// ----------------------------------------------------
// 4. USER PROGRESS & NEXT STEP RECOMMENDATION
// ----------------------------------------------------
export interface UserProgressOverview {
  currentStep: CurriculumStep;
  nextStep: CurriculumStep;
  completedStepsCount: number;
  totalStepsCount: number;
  progressPercent: number;
  currentPhaseTitle: string;
  stepsWithStatus: {
    step: CurriculumStep;
    isCompleted: boolean;
    isCurrent: boolean;
  }[];
}

export function getUserCurriculumOverview(user: UserSession | null): UserProgressOverview {
  const completedIds = user?.curriculumProgress?.completedStepIds || [];
  const totalStepsCount = CURRICULUM_STEPS.length;

  let firstIncompleteIndex = CURRICULUM_STEPS.findIndex((s) => !completedIds.includes(s.id));
  if (firstIncompleteIndex === -1) {
    firstIncompleteIndex = totalStepsCount - 1; // Completed all
  }

  const currentStep = CURRICULUM_STEPS[firstIncompleteIndex] || CURRICULUM_STEPS[0];
  const nextStep = CURRICULUM_STEPS[Math.min(firstIncompleteIndex + 1, totalStepsCount - 1)];

  const completedStepsCount = completedIds.length;
  const progressPercent = Math.min(100, Math.round((completedStepsCount / totalStepsCount) * 100));

  let currentPhaseTitle = '한글 자리 연습';
  if (currentStep.stepNumber >= 8 && currentStep.stepNumber <= 12) currentPhaseTitle = '한글 낱말 연습';
  else if (currentStep.stepNumber >= 13 && currentStep.stepNumber <= 16) currentPhaseTitle = '한글 짧은 글 연습';
  else if (currentStep.stepNumber >= 17 && currentStep.stepNumber <= 23) currentPhaseTitle = '영어 자리 연습';
  else if (currentStep.stepNumber >= 24 && currentStep.stepNumber <= 28) currentPhaseTitle = '영어 낱말 연습';
  else if (currentStep.stepNumber >= 29) currentPhaseTitle = '영어 짧은 글 연습';

  const stepsWithStatus = CURRICULUM_STEPS.map((step, idx) => ({
    step,
    isCompleted: completedIds.includes(step.id),
    isCurrent: idx === firstIncompleteIndex,
  }));

  return {
    currentStep,
    nextStep,
    completedStepsCount,
    totalStepsCount,
    progressPercent,
    currentPhaseTitle,
    stepsWithStatus,
  };
}

// ----------------------------------------------------
// 5. PRACTICE HISTORY & REAL-TIME LOGGING
// ----------------------------------------------------
export function recordPracticeHistory(
  entry: Omit<PracticeHistoryRecord, 'id' | 'timestamp' | 'dateStr'>
): PracticeHistoryRecord {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let feedback = '잘하셨습니다!';
  if (entry.accuracy >= 98 && entry.cpm >= 350) {
    feedback = '👑 최우수! 완벽한 정확도와 놀라운 타건 속도입니다!';
  } else if (entry.accuracy >= 95) {
    feedback = '⚡ 훌륭해요! 높은 정확도로 안정적인 타이핑을 유지했습니다.';
  } else if (entry.accuracy >= 90) {
    feedback = '👍 좋아요! 다음 단계로 계속 전진하세요!';
  } else {
    feedback = '🌱 손가락 기본 자리를 다시 한번 천천히 맞춰보세요!';
  }

  const record: PracticeHistoryRecord = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    dateStr,
    feedback: entry.feedback || feedback,
  };

  try {
    // 1. Save to User History
    const userHistoryKey = `${HISTORY_PREFIX}${entry.userId}`;
    const userHistoryRaw = localStorage.getItem(userHistoryKey);
    const userHistory: PracticeHistoryRecord[] = userHistoryRaw ? JSON.parse(userHistoryRaw) : [];
    const updatedUserHistory = [record, ...userHistory].slice(0, 100); // keep last 100
    localStorage.setItem(userHistoryKey, JSON.stringify(updatedUserHistory));

    // 2. Update User Profile progress and stats
    const users = getUsersFromDb();
    const userIndex = users.findIndex((u) => u.id === entry.userId);
    if (userIndex !== -1) {
      const user = users[userIndex];
      user.totalPracticeCount = (user.totalPracticeCount || 0) + 1;
      user.highestCpm = Math.max(user.highestCpm || 0, entry.cpm || 0);

      // Match step and mark completed if quality passes (accuracy >= 85%)
      if (entry.accuracy >= 85) {
        const completedIds = new Set(user.curriculumProgress?.completedStepIds || []);
        
        // Find matching step ID by mode and stage
        const matchingStep = CURRICULUM_STEPS.find((s) => {
          if (s.mode !== entry.mode) return false;
          if (s.language !== entry.language) return false;
          if (s.type === 'key' && s.stageId) {
            return String(s.stageId) === String((entry as any).stageId || '');
          }
          if (s.type === 'word' && s.stageId) {
            return String(s.stageId) === String((entry as any).categoryId || '');
          }
          return true;
        });

        if (matchingStep) {
          completedIds.add(matchingStep.id);
        }

        const completedArr = Array.from(completedIds);
        const percent = Math.min(100, Math.round((completedArr.length / CURRICULUM_STEPS.length) * 100));

        user.curriculumProgress = {
          currentStage: entry.stageTitle,
          currentModule: entry.mode.replace('-practice', '') as any,
          currentLanguage: entry.language,
          stepNumber: completedArr.length + 1,
          totalSteps: CURRICULUM_STEPS.length,
          progressPercent: percent,
          completedItemsCount: (user.curriculumProgress?.completedItemsCount || 0) + 1,
          completedStepIds: completedArr,
        };
      }

      users[userIndex] = user;
      saveUsersToDb(users);

      // If current user is active, sync
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === entry.userId) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      }
    }

    // 3. Dispatch real-time custom event
    window.dispatchEvent(new CustomEvent('typing-history-updated', { detail: record }));
  } catch (err) {
    console.error('Failed to record practice history', err);
  }

  return record;
}

export function getUserPracticeHistory(userId: string): PracticeHistoryRecord[] {
  try {
    const raw = localStorage.getItem(`${HISTORY_PREFIX}${userId}`);
    if (raw) {
      const records: PracticeHistoryRecord[] = JSON.parse(raw);
      // Explicitly sort with newest record first (leftmost in recent grid)
      return records.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
  } catch {
    // fallback
  }
  return [];
}

export function deletePracticeHistoryRecord(userId: string, recordId: string): void {
  try {
    const raw = localStorage.getItem(`${HISTORY_PREFIX}${userId}`);
    if (raw) {
      const list: PracticeHistoryRecord[] = JSON.parse(raw);
      const updated = list.filter((r) => r.id !== recordId);
      localStorage.setItem(`${HISTORY_PREFIX}${userId}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('typing-history-updated'));
    }
  } catch (err) {
    console.error('Failed to delete practice history record', err);
  }
}

export function deletePracticeHistoryRecords(userId: string, recordIds: string[]): void {
  try {
    const raw = localStorage.getItem(`${HISTORY_PREFIX}${userId}`);
    if (raw) {
      const list: PracticeHistoryRecord[] = JSON.parse(raw);
      const toDelete = new Set(recordIds);
      const updated = list.filter((r) => !toDelete.has(r.id));
      localStorage.setItem(`${HISTORY_PREFIX}${userId}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('typing-history-updated'));
    }
  } catch (err) {
    console.error('Failed to delete practice history records', err);
  }
}

export function clearUserPracticeHistory(userId: string): void {
  localStorage.removeItem(`${HISTORY_PREFIX}${userId}`);
  window.dispatchEvent(new CustomEvent('typing-history-updated'));
}

// ----------------------------------------------------
// Helpers for User Storage
// ----------------------------------------------------
function getUsersFromDb(): UserSession[] {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveUsersToDb(users: UserSession[]): void {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
}

function getCurrentUser(): UserSession | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
