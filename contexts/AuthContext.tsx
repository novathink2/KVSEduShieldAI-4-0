// Auth + Role context — Real Supabase auth with employee code / admission no support
// Powered by OnSpace.AI

import { createContext, ReactNode, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/template';
import { Role } from '@/services/mockData';

const supabase = getSupabaseClient();

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  subtitle: string;
  phone?: string;
  employeeCode?: string;
  classTeacherOf?: string;   // e.g. "10C"
  subject?: string;           // primary subject
  section?: string;           // primary section (for exams/attendance view)
  admissionNo?: string;       // full admission number (parents)
  studentName?: string;       // child's name (parents)
  busNumber?: string;         // for conductor/bus_driver
  gate?: string;              // for security
  displayName?: string;       // raw display_name from DB
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  sendOTP: (email: string) => Promise<{ error: string | null }>;
  verifyOTP: (email: string, otp: string, role: Role) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string, role: Role) => Promise<{ error: string | null }>;
  loginAs: (role: Role, identifier: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Extract employee code from email like "79553@kvs.in" → "79553"
function codeFromEmail(email: string): string {
  return email.split('@')[0];
}

// Determine display name + subtitle from user_profiles or metadata
async function fetchProfile(userId: string, role: Role, email: string): Promise<UserProfile> {
  const { data } = await supabase
    .from('user_profiles')
    .select('display_name, subtitle, phone, role, employee_code, class_teacher_of, subject, bus_number')
    .eq('id', userId)
    .single();

  if (data?.display_name) {
    const resolvedRole = (data.role as Role) ?? role;
    return {
      id: userId,
      email,
      name: data.display_name,
      displayName: data.display_name,
      role: resolvedRole,
      subtitle: data.subtitle ?? '',
      phone: data.phone ?? undefined,
      employeeCode: data.employee_code ?? codeFromEmail(email),
      classTeacherOf: data.class_teacher_of ?? undefined,
      subject: data.subject ?? undefined,
      section: data.class_teacher_of ?? undefined,
      busNumber: data.bus_number ?? undefined,
    };
  }

  // Fallback: derive from email
  const code = codeFromEmail(email);
  const teacherNames: Record<string, { name: string; designation: string; classTeacherOf?: string; subject: string }> = {
    '21160': { name: 'PADMAJA M G',        designation: 'PGT Physics',         subject: 'Physics' },
    '36580': { name: 'T L BINDU',          designation: 'PGT Physics',         subject: 'Physics' },
    '14897': { name: 'SANTHA D',           designation: 'PGT Chemistry',       subject: 'Chemistry' },
    '75662': { name: 'BROMLY THOMAS',      designation: 'PGT Chemistry',       subject: 'Chemistry' },
    '43099': { name: 'T KUMARI JAYA',      designation: 'PGT Maths',           subject: 'Mathematics' },
    '14927': { name: 'B SIVAKUMAR',        designation: 'PGT Maths',           subject: 'Mathematics' },
    '8955':  { name: 'AMBILY KRISHNAN',    designation: 'PGT Computer Science',subject: 'Computer Science', classTeacherOf: '11A' },
    '76066': { name: 'SUNITHA KRISHNAN K S',designation:'PGT Computer Science',subject: 'Computer Science' },
    '62390': { name: 'PRATHIBHA S PANICKER',designation:'PGT Biology',         subject: 'Biology' },
    '80950': { name: 'HARISREE H G',       designation: 'PGT English',         subject: 'English' },
    '100919':{ name: 'TRIPURARI KUMAR',    designation: 'PGT Economics',       subject: 'Economics' },
    '9159':  { name: 'SINDUMOL AYYAPPAN', designation: 'TGT Hindi',           subject: 'Hindi' },
    '21299': { name: 'JIJIMOL P M',        designation: 'TGT Hindi',           subject: 'Hindi' },
    '79879': { name: 'R DEEPTHI',          designation: 'TGT Hindi',           subject: 'Hindi' },
    '9098':  { name: 'SOBHA S NAIR',       designation: 'TGT Biology',         subject: 'Biology' },
    '46861': { name: 'PADMAREKHA A K',     designation: 'TGT Biology',         subject: 'Biology' },
    '77950': { name: 'ATHIRA S NAIR',      designation: 'TGT Biology',         subject: 'Biology' },
    '32456': { name: 'ASHA RAMACHANDRA N', designation: 'TGT English',         subject: 'English' },
    '9056':  { name: 'SUPRIYA V',          designation: 'TGT English',         subject: 'English' },
    '79553': { name: 'JINI P',             designation: 'TGT English',         subject: 'English', classTeacherOf: '10C' },
    '81056': { name: 'VIGNESH R',          designation: 'TGT English',         subject: 'English' },
    '12038': { name: 'JAYASREE SREEKUMAR', designation: 'TGT Maths',           subject: 'Mathematics' },
    '108719':{ name: 'AKASH TANVAR',       designation: 'TGT Maths',           subject: 'Mathematics' },
    '20214': { name: 'JOLLY JOSEPH',       designation: 'TGT SST',             subject: 'Social Science' },
    '108720':{ name: 'LAXMI M PRAYAGA',   designation: 'TGT SST',             subject: 'Social Science' },
    '21413': { name: 'JAYASREE C',         designation: 'TGT WET',             subject: 'Work Education' },
    '104003':{ name: 'NITIN KUMAR',        designation: 'TGT AE',              subject: 'Art Education' },
  };

  if (role === 'parent') {
    const last4 = email.replace('parent.', '').replace('@kvs.in', '').trim();
    const { data: student } = await supabase
      .from('students')
      .select('name, admission_no, section')
      .ilike('admission_no', `%${last4}`)
      .limit(1)
      .maybeSingle();
    const fullAdmNo = student?.admission_no ?? `****${last4}`;
    const childName = student?.name ?? 'Student';
    const childSection = student?.section ?? '';
    return {
      id: userId, email,
      name: `Parent of ${childName}`,
      displayName: `Parent of ${childName}`,
      role,
      subtitle: `${childSection} · Adm No: ${fullAdmNo}`,
      admissionNo: fullAdmNo,
      studentName: childName,
      section: childSection,
    };
  }

  // Conductor role
  if (role === 'conductor') {
    const code = codeFromEmail(email).replace('conductor.', '');
    return {
      id: userId, email,
      name: `Conductor ${code.toUpperCase()}`,
      displayName: `Conductor ${code.toUpperCase()}`,
      role,
      subtitle: `Bus Conductor · ${code.toUpperCase()}`,
      employeeCode: code,
      busNumber: code,
    };
  }

  // Bus driver role
  if (role === 'bus_driver') {
    const code = codeFromEmail(email).replace('driver.', '');
    return {
      id: userId, email,
      name: `Driver ${code.toUpperCase()}`,
      displayName: `Driver ${code.toUpperCase()}`,
      role,
      subtitle: `Bus Driver · ${code.toUpperCase()}`,
      employeeCode: code,
      busNumber: code,
    };
  }

  // Security role
  if (role === 'security') {
    const code = codeFromEmail(email).replace('security.', '');
    return {
      id: userId, email,
      name: `Security ${code.toUpperCase()}`,
      displayName: `Security ${code.toUpperCase()}`,
      role,
      subtitle: `Security Guard · Main Gate`,
      employeeCode: code,
    };
  }

  const t = teacherNames[code];
  if (t) {
    return {
      id: userId, email,
      name: t.name,
      role,
      subtitle: t.classTeacherOf ? `${t.designation} · Class Teacher ${t.classTeacherOf}` : t.designation,
      employeeCode: code,
      classTeacherOf: t.classTeacherOf,
      subject: t.subject,
      section: t.classTeacherOf ?? '10A',
    };
  }

  return { id: userId, email, name: code, role, subtitle: role, employeeCode: code, section: '10A' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const role = (data.session.user.user_metadata?.role as Role) || 'parent';
        const profile = await fetchProfile(data.session.user.id, role, data.session.user.email ?? '');
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const role = (session.user.user_metadata?.role as Role) || 'parent';
        const profile = await fetchProfile(session.user.id, role, session.user.email ?? '');
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOTP = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    return { error: error ? error.message : null };
  };

  const verifyOTP = async (email: string, otp: string, role: Role) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.auth.updateUser({ data: { role } });
      const profile = await fetchProfile(data.user.id, role, email);
      setUser(profile);
    }
    return { error: null };
  };

  const signInWithPassword = async (email: string, password: string, role: Role) => {
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // If not found, auto-create (first login)
      if (error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('not found')) {
        const res = await supabase.auth.signUp({ email, password, options: { data: { role } } });
        data = res.data as any;
        error = res.error;
      }
    }
    if (error) return { error: error.message };
    if (data?.user) {
      await supabase.auth.updateUser({ data: { role } });
      // Update user_profiles with role metadata
      await supabase.from('user_profiles').update({ role }).eq('id', data.user.id);
      const profile = await fetchProfile(data.user.id, role, email);
      setUser(profile);
    }
    return { error: null };
  };

  const loginAs = async (_role: Role, _identifier: string) => {};

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const role = (session.user.user_metadata?.role as Role) || 'parent';
      const profile = await fetchProfile(session.user.id, role, session.user.email ?? '');
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendOTP, verifyOTP, signInWithPassword, loginAs, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
