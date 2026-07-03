// Auth + Role context — Real Supabase auth, all 6 roles
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
  address?: string;
  employeeCode?: string;
  classTeacherOf?: string;
  subject?: string;
  section?: string;
  admissionNo?: string;
  studentName?: string;
  busNumber?: string;
  gate?: string;
  displayName?: string;
  teacherType?: string;
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

async function fetchProfile(userId: string, role: Role, email: string): Promise<UserProfile> {
  const { data } = await supabase
    .from('user_profiles')
    .select('display_name, subtitle, phone, role, employee_code, class_teacher_of, subject, bus_number, teacher_type, address, email')
    .eq('id', userId)
    .single();

  if (data?.display_name) {
    const resolvedRole = (data.role as Role) ?? role;
    return {
      id: userId, email: data.email ?? email,
      name: data.display_name,
      displayName: data.display_name,
      role: resolvedRole,
      subtitle: data.subtitle ?? '',
      phone: data.phone ?? undefined,
      address: data.address ?? undefined,
      employeeCode: data.employee_code ?? undefined,
      classTeacherOf: data.class_teacher_of ?? undefined,
      subject: data.subject ?? undefined,
      section: data.class_teacher_of ?? undefined,
      busNumber: data.bus_number ?? undefined,
      teacherType: data.teacher_type ?? 'Regular',
    };
  }

  // Derive from email for first login
  const code = email.split('@')[0];

  if (role === 'parent') {
    const last4 = code.replace('parent.', '').slice(-4);
    const { data: student } = await supabase
      .from('students')
      .select('name, admission_no, section')
      .ilike('admission_no', `%${last4}`)
      .limit(1)
      .maybeSingle();
    return {
      id: userId, email,
      name: student ? `Parent of ${student.name}` : `Parent (${last4})`,
      displayName: student ? `Parent of ${student.name}` : `Parent (${last4})`,
      role, subtitle: student ? `${student.section} · Adm: ${student.admission_no}` : `Parent`,
      admissionNo: student?.admission_no,
      studentName: student?.name,
      section: student?.section,
    };
  }

  if (role === 'conductor') {
    const c = code.replace('conductor.', '').toUpperCase();
    return { id: userId, email, name: `Conductor ${c}`, displayName: `Conductor ${c}`, role, subtitle: `Bus Conductor · ${c}`, employeeCode: c, busNumber: c };
  }
  if (role === 'bus_driver') {
    const c = code.replace('driver.', '').toUpperCase();
    return { id: userId, email, name: `Driver ${c}`, displayName: `Driver ${c}`, role, subtitle: `Bus Driver · ${c}`, employeeCode: c, busNumber: c };
  }
  if (role === 'security') {
    const c = code.replace('security.', '').toUpperCase();
    return { id: userId, email, name: `Guard ${c}`, displayName: `Guard ${c}`, role, subtitle: `Security Guard · Main Gate`, employeeCode: c, gate: 'Main Gate' };
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
      if (error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('not found') || error.message.toLowerCase().includes('credentials')) {
        const res = await supabase.auth.signUp({ email, password, options: { data: { role } } });
        data = res.data as any;
        error = res.error;
      }
    }
    if (error) return { error: error.message };
    if (data?.user) {
      await supabase.auth.updateUser({ data: { role } });
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
