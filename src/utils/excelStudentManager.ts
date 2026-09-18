import * as XLSX from 'xlsx';
import { UserSession } from '../types';
import { PREDEFINED_AVATARS } from '../data/practiceData';
import { typangApi } from './apiClient';

export interface ParsedStudentItem {
  name: string;
  studentId: string;
  password: string; // Automatically last 4 digits of parent phone
  phone?: string;
  parentPhone: string;
  grade?: number;
  status: 'valid' | 'warning' | 'error';
  statusMessage?: string;
}

export interface ExcelParseResult {
  success: boolean;
  students: ParsedStudentItem[];
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  message: string;
}

// --------------------------------------------------------------------------
// Real-time Cross-tab & Multi-client Synchronization (BroadcastChannel)
// --------------------------------------------------------------------------
const BROADCAST_CHANNEL_NAME = 'typang_realtime_sync_channel';

class TypangSyncChannel {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      } catch {
        this.channel = null;
      }
    }
  }

  public broadcast(type: 'STUDENT_REGISTERED' | 'USERS_UPDATED' | 'APPROVAL_CHANGED', payload: any) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
    // Also dispatch local CustomEvent for current window
    window.dispatchEvent(new CustomEvent('typang-realtime-event', {
      detail: { type, payload, timestamp: Date.now() }
    }));
  }

  public onMessage(callback: (type: string, payload: any) => void): () => void {
    const channelHandler = (event: MessageEvent) => {
      if (event.data && event.data.type) {
        callback(event.data.type, event.data.payload);
      }
    };

    const windowHandler = (event: Event) => {
      const customEvt = event as CustomEvent;
      if (customEvt.detail && customEvt.detail.type) {
        callback(customEvt.detail.type, customEvt.detail.payload);
      }
    };

    if (this.channel) {
      this.channel.addEventListener('message', channelHandler);
    }
    window.addEventListener('typang-realtime-event', windowHandler);

    return () => {
      if (this.channel) {
        this.channel.removeEventListener('message', channelHandler);
      }
      window.removeEventListener('typang-realtime-event', windowHandler);
    };
  }
}

export const typangSync = new TypangSyncChannel();

// Helper: Extract only digits
export function cleanDigits(str: string): string {
  return (str || '').replace(/[^0-9]/g, '');
}

// Helper: Format Korean phone number
export function formatKoreanPhone(raw: string): string {
  const digits = cleanDigits(raw);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

// Helper: Get last 4 digits for password
export function getLast4(phone: string): string {
  const digits = cleanDigits(phone);
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  return digits.padEnd(4, '0');
}

// --------------------------------------------------------------------------
// Generate & Download Ultra-Simple 50-Student Excel Template (.xlsx)
// --------------------------------------------------------------------------
export function downloadStudentExcelTemplate(): void {
  // Generate 50 sample/guide rows ready for quick teacher entry
  const sampleData = [
    {
      '학생 이름 (필수)': '김민준',
      '부모님 전화번호 (필수)': '010-1234-5678',
      '학년 (선택)': 3,
      '비고': '비밀번호는 부모님 번호 뒷자리(5678)로 자동 생성됩니다',
    },
    {
      '학생 이름 (필수)': '이서연',
      '부모님 전화번호 (필수)': '010-2345-6789',
      '학년 (선택)': 3,
      '비고': '비밀번호는 뒷자리(6789)로 자동 등록',
    },
    {
      '학생 이름 (필수)': '박도윤',
      '부모님 전화번호 (필수)': '010-3456-7890',
      '학년 (선택)': 4,
      '비고': '아이디 없음, 부모님 번호로 바로 로그인',
    },
    {
      '학생 이름 (필수)': '정하은',
      '부모님 전화번호 (필수)': '010-4567-8901',
      '학년 (선택)': 3,
      '비고': '',
    },
    {
      '학생 이름 (필수)': '최지호',
      '부모님 전화번호 (필수)': '010-5678-9012',
      '학년 (선택)': 2,
      '비고': '',
    }
  ];

  // Add 45 empty rows so teachers can simply fill in up to 50 students directly
  for (let i = 6; i <= 50; i++) {
    sampleData.push({
      '학생 이름 (필수)': '',
      '부모님 전화번호 (필수)': '',
      '학년 (선택)': 3,
      '비고': `${i}번 학생`,
    });
  }

  const guideSheetData = [
    { '구분': '간편 가입 안내', '내용': '타이팡 타자 50명 초간편 일괄 등록 엑셀 양식' },
    { '규칙 1': '아이디 없음', '내용': '아이디 없이 학생 이름과 부모님 전화번호만으로 로그인합니다.' },
    { '규칙 2': '비밀번호 자동 부여', '내용': '부모님 전화번호의 뒷자리 4자리가 학생 비밀번호로 자동 지정됩니다.' },
    { '규칙 3': '입력 항목', '내용': 'A열(학생 이름)과 B열(부모님 전화번호)만 채워주시면 끝납니다!' },
    { '규칙 4': '50명 동시 등록', '내용': '엑셀 파일을 업로드하거나 화면에서 표를 복사해서 바로 붙여넣을 수 있습니다.' },
  ];

  const wb = XLSX.utils.book_new();

  // Create Student List Sheet
  const wsStudents = XLSX.utils.json_to_sheet(sampleData);
  wsStudents['!cols'] = [
    { wch: 18 }, // 학생 이름
    { wch: 24 }, // 부모님 전화번호
    { wch: 14 }, // 학년
    { wch: 45 }, // 비고
  ];
  XLSX.utils.book_append_sheet(wb, wsStudents, '50명_학생명단_등록');

  // Create Guide Sheet
  const wsGuide = XLSX.utils.json_to_sheet(guideSheetData);
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, '작성방법_안내');

  // Trigger download
  XLSX.writeFile(wb, '타이팡_50명_간편가입_엑셀양식.xlsx');
}

// --------------------------------------------------------------------------
// Parse Excel File (.xlsx, .xls, .csv)
// --------------------------------------------------------------------------
export async function parseStudentExcelFile(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          resolve({
            success: false,
            students: [],
            validCount: 0,
            errorCount: 0,
            duplicateCount: 0,
            message: '엑셀 파일의 시트를 읽을 수 없습니다.',
          });
          return;
        }

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        if (!rawRows || rawRows.length === 0) {
          resolve({
            success: false,
            students: [],
            validCount: 0,
            errorCount: 0,
            duplicateCount: 0,
            message: '엑셀 파일에 등록할 데이터가 없습니다.',
          });
          return;
        }

        // Get existing users
        const existingUsers: UserSession[] = (() => {
          try {
            const raw = localStorage.getItem('typang_users_db');
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        const existingPhones = new Set(existingUsers.map((u) => cleanDigits(u.parentPhone || u.phone || '')));

        const parsedList: ParsedStudentItem[] = [];
        const seenBatchKeys = new Set<string>();
        let validCount = 0;
        let errorCount = 0;
        let duplicateCount = 0;

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];

          const rawName = String(
            row['학생 이름 (필수)'] || row['학생이름'] || row['이름'] || row['성명'] || row['name'] || row['Name'] || ''
          ).trim();

          const rawParentPhone = String(
            row['부모님 전화번호 (필수)'] || row['부모님 전화번호'] || row['부모님연락처'] || row['학부모연락처'] || row['전화번호'] || row['연락처'] || row['phone'] || row['parentPhone'] || ''
          ).trim();

          const rawGrade = Number(row['학년 (선택)'] || row['학년'] || row['grade'] || 3);

          // Skip completely empty rows
          if (!rawName && !rawParentPhone) continue;

          const digits = cleanDigits(rawParentPhone);
          const formattedPhone = formatKoreanPhone(rawParentPhone);
          const autoPw = getLast4(digits);

          let status: 'valid' | 'warning' | 'error' = 'valid';
          let statusMessage = `등록 완료 (자동 비번: ${autoPw})`;

          if (!rawName) {
            status = 'error';
            statusMessage = '학생 이름이 비어 있습니다.';
            errorCount++;
          } else if (!digits || digits.length < 7) {
            status = 'error';
            statusMessage = '부모님 전화번호가 올바르지 않습니다 (최소 7자리 이상).';
            errorCount++;
          } else if (existingPhones.has(digits)) {
            status = 'warning';
            statusMessage = `이미 등록된 번호(${formattedPhone})입니다. (정보 업데이트)`;
            duplicateCount++;
            validCount++;
          } else if (seenBatchKeys.has(digits)) {
            status = 'warning';
            statusMessage = '파일 내 동일한 번호가 중복되어 있습니다.';
            duplicateCount++;
            validCount++;
          } else {
            seenBatchKeys.add(digits);
            validCount++;
          }

          parsedList.push({
            name: rawName || `학생_${i + 1}`,
            studentId: `std_${autoPw}_${i}`,
            password: autoPw,
            phone: formattedPhone,
            parentPhone: formattedPhone,
            grade: isNaN(rawGrade) || rawGrade < 1 || rawGrade > 6 ? 3 : rawGrade,
            status,
            statusMessage,
          });
        }

        resolve({
          success: validCount > 0,
          students: parsedList,
          validCount,
          errorCount,
          duplicateCount,
          message: `총 ${parsedList.length}명 중 등록 가능: ${validCount}명, 오류: ${errorCount}명`,
        });
      } catch (err: any) {
        resolve({
          success: false,
          students: [],
          validCount: 0,
          errorCount: 0,
          duplicateCount: 0,
          message: '엑셀 파일 해석 중 오류가 발생했습니다: ' + (err?.message || ''),
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        students: [],
        validCount: 0,
        errorCount: 0,
        duplicateCount: 0,
        message: '파일을 읽는 중 오류가 발생했습니다.',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

// --------------------------------------------------------------------------
// Parse Pasted Text from Excel / Google Sheets (50 Rows Quick Paste)
// --------------------------------------------------------------------------
export function parsePastedStudentText(rawText: string): ExcelParseResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      success: false,
      students: [],
      validCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      message: '붙여넣은 텍스트에 내용이 없습니다.',
    };
  }

  const existingUsers: UserSession[] = (() => {
    try {
      const raw = localStorage.getItem('typang_users_db');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();
  const existingPhones = new Set(existingUsers.map((u) => cleanDigits(u.parentPhone || u.phone || '')));

  const parsedList: ParsedStudentItem[] = [];
  const seenBatchKeys = new Set<string>();
  let validCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Split by tab (\t), comma (,), or multiple spaces
    let parts = line.split('\t');
    if (parts.length < 2) {
      parts = line.split(',');
    }
    if (parts.length < 2) {
      parts = line.split(/\s{2,}|\s+/);
    }

    const rawName = (parts[0] || '').trim();
    // Second column is parent phone, third is optional grade
    const rawPhone = (parts[1] || '').trim();
    const rawGrade = parts[2] ? parseInt(parts[2].trim(), 10) : 3;

    // Ignore header row if accidentally pasted
    if (rawName.includes('이름') || rawPhone.includes('전화') || rawPhone.includes('연락처')) {
      continue;
    }

    const digits = cleanDigits(rawPhone);
    const formattedPhone = formatKoreanPhone(rawPhone);
    const autoPw = getLast4(digits);

    let status: 'valid' | 'warning' | 'error' = 'valid';
    let statusMessage = `등록 완료 (자동 비번: ${autoPw})`;

    if (!rawName) {
      status = 'error';
      statusMessage = '학생 이름이 비어 있습니다.';
      errorCount++;
    } else if (!digits || digits.length < 7) {
      status = 'error';
      statusMessage = '부모님 전화번호가 올바르지 않습니다 (최소 7자리 이상).';
      errorCount++;
    } else if (existingPhones.has(digits)) {
      status = 'warning';
      statusMessage = `이미 등록된 번호(${formattedPhone})입니다. (정보 업데이트)`;
      duplicateCount++;
      validCount++;
    } else if (seenBatchKeys.has(digits)) {
      status = 'warning';
      statusMessage = '목록 내 번호가 중복되어 있습니다.';
      duplicateCount++;
      validCount++;
    } else {
      seenBatchKeys.add(digits);
      validCount++;
    }

    parsedList.push({
      name: rawName,
      studentId: `std_${autoPw}_${i}`,
      password: autoPw,
      phone: formattedPhone,
      parentPhone: formattedPhone,
      grade: isNaN(rawGrade) || rawGrade < 1 || rawGrade > 6 ? 3 : rawGrade,
      status,
      statusMessage,
    });
  }

  return {
    success: validCount > 0,
    students: parsedList,
    validCount,
    errorCount,
    duplicateCount,
    message: `총 ${parsedList.length}명 중 등록 가능: ${validCount}명, 오류: ${errorCount}명`,
  };
}

// --------------------------------------------------------------------------
// Batch Insert Valid Students into Users DB with Real-time Broadcast & Server Sync
// --------------------------------------------------------------------------
export async function saveBatchStudentsToDb(
  studentsToSave: ParsedStudentItem[],
  autoApprove: boolean = true
): Promise<{ success: boolean; insertedCount: number; totalUsersCount: number; updatedUsers: UserSession[] }> {
  try {
    const validItems = studentsToSave.filter((s) => s.status !== 'error');
    if (validItems.length === 0) {
      return {
        success: false,
        insertedCount: 0,
        totalUsersCount: 0,
        updatedUsers: [],
      };
    }

    // Call server backend for durable multi-client persistence (handles 50+ students in one transaction)
    await typangApi.batchRegisterStudents(
      validItems.map((item) => ({
        name: item.name,
        parentPhone: item.parentPhone,
        grade: item.grade || 3,
      }))
    );

    // Fetch refreshed complete list
    const updatedUsers = await typangApi.getUsers();

    // Broadcast in real-time to Master & all other clients
    typangSync.broadcast('STUDENT_REGISTERED', {
      count: validItems.length,
      sampleNames: validItems.slice(0, 3).map((u) => u.name),
      newUsers: validItems,
    });
    typangSync.broadcast('USERS_UPDATED', updatedUsers);

    // Also fire local events
    window.dispatchEvent(new CustomEvent('users-list-updated', { detail: updatedUsers }));
    window.dispatchEvent(new CustomEvent('student-registered', {
      detail: {
        isBatch: true,
        count: validItems.length,
        students: validItems,
      }
    }));

    return {
      success: true,
      insertedCount: validItems.length,
      totalUsersCount: updatedUsers.length,
      updatedUsers,
    };
  } catch (err) {
    console.error('Failed to batch save students', err);
    const localUsers = await typangApi.getUsers();
    return {
      success: false,
      insertedCount: 0,
      totalUsersCount: localUsers.length,
      updatedUsers: localUsers,
    };
  }
}

// --------------------------------------------------------------------------
// Broadcast Single Student Registration in Real-Time
// --------------------------------------------------------------------------
export function notifyStudentRegistered(newUser: UserSession, updatedDb: UserSession[]): void {
  typangSync.broadcast('STUDENT_REGISTERED', {
    name: newUser.name,
    studentId: newUser.studentId,
    phone: newUser.phone,
    parentPhone: newUser.parentPhone,
    grade: newUser.grade,
    user: newUser,
  });
  typangSync.broadcast('USERS_UPDATED', updatedDb);

  window.dispatchEvent(new CustomEvent('users-list-updated', { detail: updatedDb }));
  window.dispatchEvent(new CustomEvent('student-registered', { detail: newUser }));
}
