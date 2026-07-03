// Real school data service — fetches from Supabase
// Powered by OnSpace.AI

import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

export interface StudentRow {
  id: string;
  name: string;
  admission_no: string;
  section: string;
  attendance_pct: number;
  bus_id?: string | null;
  parent_user_id?: string | null;
}

export interface AttendanceRow {
  student_id: string;
  date: string;
  present: boolean;
}

// Fetch students by section
export async function fetchStudents(section: string): Promise<StudentRow[]> {
  const { data, error } = await supabase
    .from('students')
    .select('id, name, admission_no, section, attendance_pct, bus_id, parent_user_id')
    .eq('section', section)
    .order('name');
  if (error || !data) return [];
  return data as StudentRow[];
}

// Fetch today's attendance for a section — default ALL present
export async function fetchTodayAttendance(section: string): Promise<Record<string, boolean>> {
  const today = new Date().toISOString().split('T')[0];
  const students = await fetchStudents(section);
  if (!students.length) return {};

  const ids = students.map(s => s.id);
  const { data } = await supabase
    .from('attendance')
    .select('student_id, present')
    .in('student_id', ids)
    .eq('date', today);

  const map: Record<string, boolean> = {};
  // Default: ALL present (no hardware — simulate full attendance)
  students.forEach(s => { map[s.id] = true; });
  if (data) data.forEach((r: AttendanceRow) => { map[r.student_id] = r.present; });
  return map;
}

// Save attendance for today
export async function saveAttendance(
  section: string,
  presence: Record<string, boolean>,
  markedBy?: string
): Promise<{ error: string | null }> {
  const today = new Date().toISOString().split('T')[0];
  const rows = Object.entries(presence).map(([student_id, present]) => ({
    student_id, date: today, present,
    marked_by: markedBy ?? null,
  }));

  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'student_id,date' });

  // Update attendance_pct for absent students
  const absentIds = Object.entries(presence).filter(([, p]) => !p).map(([id]) => id);
  if (absentIds.length > 0) {
    for (const sid of absentIds) {
      const { data: student } = await supabase
        .from('students')
        .select('attendance_pct')
        .eq('id', sid)
        .single();
      if (student) {
        const newPct = Math.max(0, (student.attendance_pct ?? 90) - 1);
        await supabase.from('students').update({ attendance_pct: newPct }).eq('id', sid);
      }
    }
  }

  return { error: error?.message ?? null };
}

// Generate CSV string from attendance data (Excel compatible)
export function generateAttendanceCSV(
  students: StudentRow[],
  presence: Record<string, boolean>,
  section: string
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fileName = `Class${section.replace(' ', '')}_${now.toLocaleDateString('en-IN').replace(/\//g, '_')}`;

  const header = `KVS EduShield AI - Attendance Report\nSection: ${section}\nDate: ${dateStr}\nGenerated: ${timeStr}\n\n`;
  const cols = 'Roll No,Admission No,Student Name,Status,Time\n';
  const rows = students.map((s, i) =>
    `${i + 1},${s.admission_no},"${s.name}",${presence[s.id] ? 'Present' : 'Absent'},${presence[s.id] ? timeStr : '—'}`
  ).join('\n');

  const present = Object.values(presence).filter(Boolean).length;
  const total = students.length;
  const absent = total - present;
  const summary = `\n\nSummary\nTotal Students,${total}\nPresent,${present}\nAbsent,${absent}\nAttendance %,${total > 0 ? Math.round((present / total) * 100) : 0}%`;
  const absentNames = students.filter(s => !presence[s.id]).map(s => s.name).join('; ');
  const absentSection = absent > 0 ? `\n\nAbsent Students\n${absentNames}` : '';

  return header + cols + rows + summary + absentSection;
}

// Fetch attendance history for a student
export async function fetchStudentAttendanceHistory(studentId: string, days = 30): Promise<AttendanceRow[]> {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const { data } = await supabase
    .from('attendance')
    .select('student_id, date, present')
    .eq('student_id', studentId)
    .gte('date', from.toISOString().split('T')[0])
    .order('date', { ascending: false });
  return (data as AttendanceRow[]) ?? [];
}

// Fetch notices
export async function fetchNotices(targetRole?: string): Promise<any[]> {
  let query = supabase.from('notices').select('*').order('created_at', { ascending: false });
  if (targetRole) {
    query = query.or(`target_role.eq.all,target_role.eq.${targetRole}`);
  }
  const { data } = await query.limit(20);
  return data ?? [];
}

// Fetch homework for section
export async function fetchHomework(section: string): Promise<any[]> {
  const { data } = await supabase
    .from('homework')
    .select('*')
    .eq('section', section)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// Save homework
export async function saveHomework(hw: {
  subject: string; title: string; description: string;
  section: string; due_date: string; assigned_by?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('homework').insert(hw);
  return { error: error?.message ?? null };
}

// Fetch lessons for section
export async function fetchLessons(section: string, limit = 20): Promise<any[]> {
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('section', section)
    .order('lesson_date', { ascending: false })
    .limit(limit);
  return data ?? [];
}

// Save lesson
export async function saveLesson(lesson: {
  subject: string; chapter: string; topic: string;
  section: string; lesson_date: string; taught_by?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('lessons').insert(lesson);
  return { error: error?.message ?? null };
}

// Fetch timetable
export async function fetchTimetable(section: string, day?: string): Promise<any[]> {
  let query = supabase
    .from('timetable')
    .select('*')
    .eq('section', section)
    .order('period');
  if (day) query = query.eq('day_of_week', day);
  const { data } = await query;
  return data ?? [];
}

// Fetch incidents for section or all
export async function fetchIncidents(section?: string): Promise<any[]> {
  let query = supabase.from('incidents').select('*').order('created_at', { ascending: false }).limit(50);
  if (section) query = query.eq('section', section);
  const { data } = await query;
  return data ?? [];
}

// Save incident
export async function saveIncident(inc: {
  student_name: string; type: string; notes: string;
  section: string; severity: string; reported_by?: string; student_id?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('incidents').insert(inc);
  return { error: error?.message ?? null };
}

// Fetch exam results for a student
export async function fetchStudentExamResults(studentId: string): Promise<any[]> {
  const { data } = await supabase
    .from('exam_marks')
    .select('*, exams(name,subject,exam_date,max_marks,section)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// Bus events — simulate boarding/dropping without hardware
export async function logBusEvent(event: {
  bus_id: string; student_id: string; event_type: string; created_by?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('bus_events').insert(event);
  return { error: error?.message ?? null };
}

export async function fetchBusEvents(busId: string): Promise<any[]> {
  const { data } = await supabase
    .from('bus_events')
    .select('*, students(name,admission_no,section)')
    .eq('bus_id', busId)
    .order('timestamp', { ascending: false })
    .limit(50);
  return data ?? [];
}

// Update user profile
export async function updateUserProfile(userId: string, updates: {
  display_name?: string; phone?: string; subtitle?: string; subject?: string;
  class_teacher_of?: string | null; employee_code?: string; bus_number?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('user_profiles').update(updates).eq('id', userId);
  return { error: error?.message ?? null };
}

// Fetch remarks for a student
export async function fetchRemarks(studentId: string): Promise<any[]> {
  const { data } = await supabase
    .from('remarks')
    .select('*, user_profiles(display_name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// Add remark
export async function addRemark(remark: {
  student_id: string; teacher_id: string; remark_text: string; category: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('remarks').insert(remark);
  return { error: error?.message ?? null };
}

// Fetch early pickup requests
export async function fetchPickupRequests(filter?: { student_id?: string }): Promise<any[]> {
  let query = supabase
    .from('early_pickup_requests')
    .select('*, students(name,admission_no,section)')
    .order('created_at', { ascending: false });
  if (filter?.student_id) query = query.eq('student_id', filter.student_id);
  const { data } = await query;
  return data ?? [];
}

// Create pickup request
export async function createPickupRequest(req: {
  student_id: string; parent_user_id: string; pickup_time: string;
  reason: string; authorized_person?: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('early_pickup_requests').insert(req);
  return { error: error?.message ?? null };
}

// Update pickup request status
export async function updatePickupStatus(id: string, status: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('early_pickup_requests').update({ status }).eq('id', id);
  return { error: error?.message ?? null };
}

// Fetch all buses
export async function fetchBuses(): Promise<any[]> {
  const { data } = await supabase.from('buses').select('*').order('number');
  return data ?? [];
}
