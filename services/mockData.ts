// Mock data for V1.0 (representative KVS Class 10 dataset)
// Powered by OnSpace.AI

export type Role = 'parent' | 'teacher' | 'admin' | 'conductor' | 'bus_driver' | 'security';

export type FeedKind =
  | 'bus_boarded'
  | 'school_arrived'
  | 'return_boarded'
  | 'home_arrived'
  | 'attendance'
  | 'lesson'
  | 'homework'
  | 'notice'
  | 'incident'
  | 'remark';

export interface FeedItem {
  id: string;
  kind: FeedKind;
  title: string;
  subtitle: string;
  time: string;
  detail?: string;
  status?: 'success' | 'info' | 'warning' | 'danger';
}

export interface Bus {
  id: string;
  number: string;
  driver: string;
  route: string;
  status: 'On Route' | 'At School' | 'Idle' | 'Returning';
  eta: string;
  speed: number;
  occupancy: number;
  capacity: number;
}

export interface ClassSection {
  id: string;
  name: string;
  studentCount: number;
  classTeacher: string;
  classTeacherCode?: string;
}

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  section: string;
  present: boolean;
  attendancePct: number;
  parentPhone: string;
}

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  completionRate: number;
}

export interface Lesson {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  date: string;
}

export interface Incident {
  id: string;
  studentName: string;
  type: 'Illness' | 'Injury' | 'Bullying' | 'Behaviour' | 'Emergency';
  notes: string;
  time: string;
}

// -------- Teacher roster (from PDF) ---------
export interface TeacherInfo {
  employeeCode: string;
  name: string;
  designation: string;
  subject: string;
  classTeacherOf?: string;
}

export const TEACHERS: TeacherInfo[] = [
  { employeeCode: '21160', name: 'PADMAJA M G',          designation: 'PGT Physics',         subject: 'Physics' },
  { employeeCode: '36580', name: 'T L BINDU',            designation: 'PGT Physics',         subject: 'Physics' },
  { employeeCode: '14897', name: 'SANTHA D',             designation: 'PGT Chemistry',       subject: 'Chemistry' },
  { employeeCode: '75662', name: 'BROMLY THOMAS',        designation: 'PGT Chemistry',       subject: 'Chemistry' },
  { employeeCode: '43099', name: 'T KUMARI JAYA',        designation: 'PGT Maths',           subject: 'Mathematics' },
  { employeeCode: '14927', name: 'B SIVAKUMAR',          designation: 'PGT Maths',           subject: 'Mathematics' },
  { employeeCode: '8955',  name: 'AMBILY KRISHNAN',      designation: 'PGT Computer Science',subject: 'Computer Science', classTeacherOf: '11A' },
  { employeeCode: '76066', name: 'SUNITHA KRISHNAN K S', designation: 'PGT Computer Science',subject: 'Computer Science' },
  { employeeCode: '62390', name: 'PRATHIBHA S PANICKER', designation: 'PGT Biology',         subject: 'Biology' },
  { employeeCode: '80950', name: 'HARISREE H G',         designation: 'PGT English',         subject: 'English' },
  { employeeCode: '100919',name: 'TRIPURARI KUMAR',      designation: 'PGT Economics',       subject: 'Economics' },
  { employeeCode: '9159',  name: 'SINDUMOL AYYAPPAN',   designation: 'TGT Hindi',           subject: 'Hindi' },
  { employeeCode: '21299', name: 'JIJIMOL P M',          designation: 'TGT Hindi',           subject: 'Hindi' },
  { employeeCode: '79879', name: 'R DEEPTHI',            designation: 'TGT Hindi',           subject: 'Hindi' },
  { employeeCode: '9098',  name: 'SOBHA S NAIR',         designation: 'TGT Biology',         subject: 'Biology' },
  { employeeCode: '46861', name: 'PADMAREKHA A K',       designation: 'TGT Biology',         subject: 'Biology' },
  { employeeCode: '77950', name: 'ATHIRA S NAIR',        designation: 'TGT Biology',         subject: 'Biology' },
  { employeeCode: '32456', name: 'ASHA RAMACHANDRA N',   designation: 'TGT English',         subject: 'English' },
  { employeeCode: '9056',  name: 'SUPRIYA V',            designation: 'TGT English',         subject: 'English' },
  { employeeCode: '79553', name: 'JINI P',               designation: 'TGT English',         subject: 'English', classTeacherOf: '10C' },
  { employeeCode: '81056', name: 'VIGNESH R',            designation: 'TGT English',         subject: 'English' },
  { employeeCode: '12038', name: 'JAYASREE SREEKUMAR',   designation: 'TGT Maths',           subject: 'Mathematics' },
  { employeeCode: '108719',name: 'AKASH TANVAR',         designation: 'TGT Maths',           subject: 'Mathematics' },
  { employeeCode: '20214', name: 'JOLLY JOSEPH',         designation: 'TGT SST',             subject: 'Social Science' },
  { employeeCode: '108720',name: 'LAXMI M PRAYAGA',     designation: 'TGT SST',             subject: 'Social Science' },
  { employeeCode: '21413', name: 'JAYASREE C',           designation: 'TGT WET',             subject: 'Work Education' },
  { employeeCode: '104003',name: 'NITIN KUMAR',          designation: 'TGT AE',              subject: 'Art Education' },
];

// -------- Parent feed (hero) ---------
export const parentFeed: FeedItem[] = [
  { id: 'f1', kind: 'home_arrived',  title: 'Aarav reached home safely',       subtitle: 'Bus 3 · Sector 12 Stop',       time: '4:18 PM', status: 'success' },
  { id: 'f2', kind: 'return_boarded',title: 'Boarded return bus',              subtitle: 'Bus 3 · ETA home 4:20 PM',     time: '3:42 PM', status: 'info' },
  { id: 'f3', kind: 'homework',      title: 'New homework: Triangles worksheet',subtitle: 'Mathematics · Due tomorrow',   time: '2:10 PM', detail: 'Solve Q1-Q8 on Similarity Theorem from page 142.', status: 'warning' },
  { id: 'f4', kind: 'lesson',        title: 'Lesson taught: pH Scale',          subtitle: 'Science · Acids and Bases',   time: '12:30 PM', status: 'info' },
  { id: 'f5', kind: 'attendance',    title: 'Marked Present',                   subtitle: 'Class 10A · 8:02 AM',         time: '8:02 AM', status: 'success' },
  { id: 'f6', kind: 'school_arrived',title: 'Reached school safely',            subtitle: 'Bus 3 · Gate 2',              time: '7:48 AM', status: 'success' },
  { id: 'f7', kind: 'bus_boarded',   title: 'Boarded Bus 3',                    subtitle: 'Sector 12 Stop · R. Singh',   time: '7:15 AM', status: 'info' },
  { id: 'f8', kind: 'notice',        title: 'PTM scheduled this Saturday',      subtitle: 'Principal Office',            time: 'Yesterday', detail: 'Parent Teacher Meeting for Class 10 on Saturday 10 AM.', status: 'info' },
];

// -------- Buses ---------
export const buses: Bus[] = [
  { id: 'b1', number: 'Bus 1', driver: 'M. Sharma', route: 'Sector 4 → School',   status: 'On Route',  eta: '7:42 AM', speed: 32, occupancy: 38, capacity: 42 },
  { id: 'b2', number: 'Bus 2', driver: 'K. Verma',  route: 'Sector 8 → School',   status: 'At School', eta: 'Arrived', speed: 0,  occupancy: 40, capacity: 42 },
  { id: 'b3', number: 'Bus 3', driver: 'R. Singh',  route: 'Sector 12 → School',  status: 'Returning', eta: '4:20 PM', speed: 28, occupancy: 36, capacity: 42 },
  { id: 'b4', number: 'Bus 4', driver: 'A. Khan',   route: 'DLF Phase 2 → School',status: 'On Route',  eta: '7:55 AM', speed: 24, occupancy: 30, capacity: 42 },
  { id: 'b5', number: 'Bus 5', driver: 'P. Yadav',  route: 'Sector 21 → School',  status: 'Idle',      eta: '—',       speed: 0,  occupancy: 0,  capacity: 42 },
];

// -------- Classes (updated with real teachers) ---------
export const classes: ClassSection[] = [
  { id: 'c10a', name: 'Class 10 A', studentCount: 36,  classTeacher: 'Mrs. Nair',       classTeacherCode: '' },
  { id: 'c10b', name: 'Class 10 B', studentCount: 36,  classTeacher: 'Mr. Bhalla',      classTeacherCode: '' },
  { id: 'c10c', name: 'Class 10 C', studentCount: 48,  classTeacher: 'JINI P',          classTeacherCode: '79553' },
  { id: 'c10d', name: 'Class 10 D', studentCount: 36,  classTeacher: 'Mr. Khanna',      classTeacherCode: '' },
  { id: 'c11a', name: 'Class 11 A', studentCount: 50,  classTeacher: 'AMBILY KRISHNAN', classTeacherCode: '8955' },
];

// -------- Students (Class 10A fallback) ---------
const indianNames = [
  'Aarav Sharma','Vihaan Kapoor','Ananya Reddy','Ishaan Mehta','Diya Iyer',
  'Kabir Joshi','Saanvi Patel','Reyansh Gupta','Aadhya Nair','Arjun Rao',
  'Myra Singh','Aryan Verma','Anika Bose','Krish Malhotra','Pari Chawla',
  'Rohan Desai','Tara Pillai','Yuvraj Khanna','Riya Bhatt','Aditya Saxena',
  'Kiara Menon','Veer Bhalla','Sara Agarwal','Dev Mishra','Navya Banerjee',
  'Shaurya Chopra','Mira Dutta','Ayaan Sethi','Avni Tiwari','Atharv Joshi',
  'Anaya Bansal','Kayan Goel','Trisha Rao','Vivaan Sinha','Ira Kumar','Yash Walia',
];

export const studentsClass10A: Student[] = indianNames.map((name, i) => ({
  id: `s${i + 1}`,
  name,
  admissionNo: `KV2024-${1001 + i}`,
  section: '10A',
  present: i % 9 !== 0,
  attendancePct: 78 + ((i * 7) % 22),
  parentPhone: `+91 98${String(100000 + i * 137).slice(0, 6)}`,
}));

// -------- Homework ---------
export const homeworkList: Homework[] = [
  { id: 'h1', subject: 'Mathematics', title: 'Triangles worksheet',   description: 'Solve Q1-Q8 from Similarity Theorem.', dueDate: 'Tomorrow',   completionRate: 62 },
  { id: 'h2', subject: 'Science',     title: 'pH Scale assignment',   description: 'List 10 household substances with their pH.', dueDate: 'Fri 4 Jul', completionRate: 41 },
  { id: 'h3', subject: 'English',     title: 'Letter writing',        description: 'Formal letter to editor on traffic safety.', dueDate: 'Mon 7 Jul', completionRate: 18 },
  { id: 'h4', subject: 'Hindi',       title: 'Vyakaran Abhyas',       description: 'Path 5 ke prashn uttar likhein.',            dueDate: 'Wed 2 Jul', completionRate: 88 },
];

// -------- Lessons ---------
export const lessonsTaught: Lesson[] = [
  { id: 'l1', subject: 'Science',       chapter: 'Acids and Bases',       topic: 'pH Scale',                date: 'Today' },
  { id: 'l2', subject: 'Mathematics',   chapter: 'Triangles',             topic: 'Similarity Theorem',      date: 'Today' },
  { id: 'l3', subject: 'English',       chapter: 'First Flight',          topic: 'A Letter to God',         date: 'Yesterday' },
  { id: 'l4', subject: 'Social Science',chapter: 'Nationalism in India',  topic: 'Non-Cooperation Movement',date: 'Yesterday' },
  { id: 'l5', subject: 'Hindi',         chapter: 'Kshitij',              topic: 'Sur ke pad - Surdas',     date: 'Mon' },
];

// -------- Incidents ---------
export const incidents: Incident[] = [
  { id: 'i1', studentName: 'Reyansh Gupta', type: 'Illness', notes: 'Mild fever, sent to sick bay.', time: '11:20 AM' },
  { id: 'i2', studentName: 'Kabir Joshi',   type: 'Injury',  notes: 'Scraped knee during PE.',       time: 'Yesterday' },
];

// -------- Admin analytics ---------
export const adminStats = {
  totalStudents: 264,
  totalTeachers: 27,
  totalBuses: 5,
  presentToday: 247,
  absentToday: 17,
  homeworkPending: 24,
  incidentsThisWeek: 3,
  busesOnRoute: 3,
};

// -------- Learning gaps ---------
export interface LearningGap {
  id: string;
  studentName: string;
  subject: string;
  topic: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendedMinutes: number;
}

export const learningGaps: LearningGap[] = [
  { id: 'g1', studentName: 'Aarav Sharma', subject: 'Science',     topic: 'pH Scale',           riskLevel: 'Low',    recommendedMinutes: 20 },
  { id: 'g2', studentName: 'Aarav Sharma', subject: 'Mathematics', topic: 'Similarity Theorem', riskLevel: 'Medium', recommendedMinutes: 30 },
  { id: 'g3', studentName: 'Aarav Sharma', subject: 'English',     topic: 'Letter Writing',     riskLevel: 'Low',    recommendedMinutes: 15 },
];

// -------- Notices ---------
export const notices = [
  { id: 'n1', title: 'PTM this Saturday 10 AM',  body: 'Parent Teacher Meeting for Class 10. All parents requested to attend.', time: 'Yesterday' },
  { id: 'n2', title: 'Half-Yearly Exam schedule', body: 'Half-yearly exams begin Mon 21 July. Datesheet attached.',              time: '2 days ago' },
  { id: 'n3', title: 'Bus 5 maintenance',          body: 'Bus 5 unavailable Friday. Alternate transport arranged.',               time: '3 days ago' },
];
