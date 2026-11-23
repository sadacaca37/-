/**
 * 선생님: 엑셀로 학생 한꺼번에 올리기 (모아팡 반에 학생을 만들고 바로 승인)
 *  - 엑셀 열: 이름 · 학년 · 전화번호 (타자팡은 반 없이 학년만 — 모아팡 반과 따로)
 *  - 학생은 모아팡 반 학생으로 생기고(같은 반 같은 이름 = 같은 학생), 타자팡 저장도 바로 승인됨
 *  - 학부모 전화번호는 선생님만 볼 수 있는 곳(taja_private)에 저장 → 성적표 문자 보낼 때 씀
 */
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { fs, cleanName, userIdOf, MEMBER_CID, MEMBER_CLASS, memberKey, phoneDigits } from './moaFirebase';
import { setApprovals } from './tajaApproval';
import { fixPhoneDigits, formatKoreanPhone } from './excelStudentManager';

const loadXlsx = () => import('xlsx');

export interface ImportRow {
  cls: string;
  name: string;
  grade: number;
  phone: string;
}

const norm = (v: any) => String(v ?? '').replace(/\s+/g, '').toLowerCase();
const COLS = {
  cls: ['반', '방번호', '학급', 'class'],
  name: ['이름', '학생이름', '성명', 'name'],
  grade: ['학년', 'grade'],
  phone: ['전화', '학부모', '부모님', '연락처', '휴대폰', 'phone'],
};

/** 양식 내려받기 */
export async function downloadMoaTemplate(classNames: string[]) {
  const XLSX = await loadXlsx();
  void classNames;
  const rows = [
    { 이름: '김타자', 학년: 3, '전화번호': '010-1234-5678' },
    { 이름: '이모아', 학년: 3, '전화번호': '010-2345-6789' },
    { 이름: '박팡팡', 학년: 4, '전화번호': '010-3456-7890' },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, '학생명단');
  const help = XLSX.utils.json_to_sheet([
    { 안내: '학생은 이름 + 전화번호로 타자팡에 로그인해요. 전화번호는 꼭 써 주세요. (학부모 번호 그대로 써도 돼요)' },
    { 안내: '타자팡은 반 없이 학년만 써요. (모아팡 반과는 따로예요)' },
    { 안내: '이름과 전화번호가 같은 학생이 이미 있으면 새로 만들지 않고 학년만 고쳐요.' },
    { 안내: '올린 학생은 바로 승인되어 로그인할 수 있어요. 전화번호는 성적표 문자 보낼 때도 쓰여요.' },
  ]);
  help['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, help, '안내');
  XLSX.writeFile(wb, '타자팡_학생명단_양식.xlsx');
}

/** 엑셀 읽기 → 줄 목록 */
export async function readImportFile(file: File): Promise<ImportRow[]> {
  const XLSX = await loadXlsx();
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  for (let h = 0; h < Math.min(10, matrix.length); h++) {
    const head = matrix[h].map(norm);
    const col = (keys: string[]) => head.findIndex((c) => keys.some((k) => c.includes(norm(k))));
    const ci = col(COLS.cls);
    const ni = col(COLS.name);
    if (ni < 0) continue;
    const gi = col(COLS.grade);
    const pi = col(COLS.phone);
    return matrix
      .slice(h + 1)
      .map((r) => ({
        cls: ci >= 0 ? String(r[ci] ?? '').trim() : '',
        name: cleanName(String(r[ni] ?? '')),
        grade: Math.max(0, Math.min(6, parseInt(String(gi >= 0 ? r[gi] : ''), 10) || 0)),
        phone: pi >= 0 ? fixPhoneDigits(String(r[pi] ?? '')) : '',
      }))
      .filter((r) => r.name);
  }
  return [];
}

/** 선생님: 올리기 → 타자팡 회원(이름 + 전화번호)으로 만들고 바로 승인. 만든/고친 학생 수와 못 넣은 줄 */
export async function importStudents(rows: ImportRow[], _defaultClass = ''): Promise<{ created: number; updated: number; skipped: string[] }> {
  let created = 0;
  let updated = 0;
  const skipped: string[] = [];
  const approved: string[] = [];
  for (const r of rows) {
    if (!/^01[016789][0-9]{7,8}$/.test(phoneDigits(r.phone))) {
      skipped.push(`${r.name} (전화번호 없음·틀림)`);
      continue;
    }
    const key = await memberKey(r.name, r.phone);
    const id = userIdOf(MEMBER_CID, key);
    const ref = doc(fs, 'classes', MEMBER_CID, 'students', key);
    try {
      const snap = await getDoc(ref);
      const taja = { ...((snap.exists() && (snap.data() as any).taja) || {}), phone: phoneDigits(r.phone), className: MEMBER_CLASS };
      if (r.grade) {
        taja.grade = r.grade;
        taja.levelTitle = `${r.grade}학년 타자 꿈나무`;
      }
      if (snap.exists()) {
        await setDoc(ref, { taja }, { merge: true });
        updated++;
      } else {
        await setDoc(ref, { name: r.name, uid: '', score: 0, outfit: null, created: serverTimestamp(), seen: serverTimestamp(), taja });
        created++;
      }
      approved.push(id);
    } catch {
      skipped.push(`${r.name} (저장 실패)`);
    }
  }
  if (approved.length) await setApprovals(approved, true);
  return { created, updated, skipped };
}

/** 선생님: 학부모 전화번호 모음 { 학생 id: 전화번호 } */
export async function readParentPhones(): Promise<Record<string, string>> {
  try {
    const snap = await getDocs(collection(fs, 'taja_private'));
    const out: Record<string, string> = {};
    snap.docs.forEach((d) => {
      const p = (d.data() as any).parentPhone;
      if (p) out[d.id] = String(p);
    });
    return out;
  } catch {
    return {};
  }
}

/** 선생님: 한 학생의 학부모 전화번호 고치기 */
export async function saveParentPhone(userId: string, phone: string): Promise<boolean> {
  try {
    await setDoc(doc(fs, 'taja_private', userId), { parentPhone: formatKoreanPhone(fixPhoneDigits(phone)), updatedAt: Date.now() }, { merge: true });
    return true;
  } catch {
    return false;
  }
}
