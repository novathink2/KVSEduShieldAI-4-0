// Role-specific login — supports all roles including conductor, bus_driver, security
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '@/template';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/services/mockData';

// ============================================================
// Credential mapping rules
// Teacher/Admin: email = code@kvs.in, password = Kvpatm2.<code>
// Parent:        email = parent.<last4>@kvs.in, password = Pass@<last4>
// Conductor:     email = conductor.<code>@kvs.in, password = Cond@<code>
// Bus Driver:    email = driver.<code>@kvs.in, password = Driver@<code>
// Security:      email = security.<code>@kvs.in, password = Security@<code>
// ============================================================

const cfg: Record<Role, {
  title: string; helper: string; field1: string; ph1: string; ph2: string; gradient: [string, string];
}> = {
  parent: {
    title: 'Parent Login',
    helper: 'Username: Parent@Last4Digits  •  Pass: Pass@Last4Digits',
    field1: 'Username', ph1: 'Parent@4350', ph2: 'Pass@4350',
    gradient: ['#0F2A5C', '#2A6FDB'],
  },
  teacher: {
    title: 'Teacher Login',
    helper: 'Username: Employee Code  •  Password: Kvpatm2.<code>',
    field1: 'Employee Code', ph1: 'e.g. 79553', ph2: 'Kvpatm2.79553',
    gradient: ['#1B5E3F', '#1FA971'],
  },
  admin: {
    title: 'Admin Login',
    helper: 'Username: Employee Code  •  Password: Kvpatm2.<code>',
    field1: 'Employee Code', ph1: 'e.g. 21160', ph2: 'Kvpatm2.21160',
    gradient: ['#6B3FA0', '#A36BD6'],
  },
  conductor: {
    title: 'Conductor Login',
    helper: 'Code: C001–C005  •  Pass: Cond@<code>',
    field1: 'Conductor Code', ph1: 'e.g. C001', ph2: 'Cond@C001',
    gradient: ['#B45309', '#F59E0B'],
  },
  bus_driver: {
    title: 'Bus Driver Login',
    helper: 'Code: D001–D005  •  Pass: Driver@<code>',
    field1: 'Driver Code', ph1: 'e.g. D001', ph2: 'Driver@D001',
    gradient: ['#064E3B', '#10B981'],
  },
  security: {
    title: 'Security Guard Login',
    helper: 'Code: SG001–SG003  •  Pass: Security@<code>',
    field1: 'Guard Code', ph1: 'e.g. SG001', ph2: 'Security@SG001',
    gradient: ['#7F1D1D', '#EF4444'],
  },
};

function extractLast4(identifier: string): string {
  return identifier.trim().replace(/^[Pp]arent@/i, '').replace(/@.*/, '').slice(-4);
}

function toEmail(role: Role, identifier: string): string {
  const id = identifier.trim().toLowerCase();
  if (role === 'parent') return `parent.${extractLast4(identifier)}@kvs.in`;
  if (role === 'conductor') return `conductor.${id}@kvs.in`;
  if (role === 'bus_driver') return `driver.${id}@kvs.in`;
  if (role === 'security') return `security.${id}@kvs.in`;
  return `${id.replace(/@.*/, '')}@kvs.in`;
}

function defaultPassword(role: Role, identifier: string): string {
  const id = identifier.trim();
  if (role === 'parent') return `Pass@${extractLast4(identifier)}`;
  if (role === 'conductor') return `Cond@${id}`;
  if (role === 'bus_driver') return `Driver@${id}`;
  if (role === 'security') return `Security@${id}`;
  return `Kvpatm2.${id}`;
}

const testCreds: Record<Role, string[]> = {
  parent: ['SIVAGANGA N S (10C):  Parent@4350 / Pass@4350', 'SANA D S (10C):  Parent@4351 / Pass@4351'],
  teacher: ['JINI P (10C class teacher):  79553 / Kvpatm2.79553', 'AMBILY KRISHNAN (11A):  8955 / Kvpatm2.8955'],
  admin: ['Admin code: 21160 / Kvpatm2.21160'],
  conductor: ['Bus 1 conductor:  C001 / Cond@C001', 'Bus 3 conductor:  C003 / Cond@C003'],
  bus_driver: ['Bus 1 driver:  D001 / Driver@D001', 'Bus 3 driver:  D003 / Driver@D003'],
  security: ['Main gate guard:  SG001 / Security@SG001'],
};

export default function LoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role as Role) || 'parent';
  const config = cfg[role] ?? cfg.parent;
  const { signInWithPassword } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      showAlert('Missing field', `Please enter your ${config.field1.toLowerCase()}.`);
      return;
    }
    const email = toEmail(role, identifier);
    const pass = password.trim() || defaultPassword(role, identifier);
    setBusy(true);
    const { error } = await signInWithPassword(email, pass, role);
    setBusy(false);
    if (error) { showAlert('Login failed', error); return; }
    if (role === 'teacher') router.replace('/(teacher)');
    else if (role === 'admin') router.replace('/(admin)');
    else if (role === 'conductor') router.replace('/(conductor)');
    else if (role === 'bus_driver') router.replace('/(bus_driver)');
    else if (role === 'security') router.replace('/(security)');
    else router.replace('/(parent)');
  };

  return (
    <LinearGradient colors={config.gradient} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
              <MaterialCommunityIcons name="arrow-left" color="#fff" size={22} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <MaterialCommunityIcons name="shield-star" size={22} color={Colors.saffron} />
              </View>
              <Text style={styles.brand}>KVS EduShield AI</Text>
            </View>

            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.helper}>{config.helper}</Text>

            <View style={styles.card}>
              <Text style={styles.label}>{config.field1}</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={config.ph1}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: Spacing.lg }]}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={config.ph2}
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                />
                <Pressable onPress={() => setShowPass(p => !p)} hitSlop={8} style={styles.eyeBtn}>
                  <MaterialCommunityIcons name={showPass ? 'eye-off' : 'eye'} color={Colors.textMuted} size={20} />
                </Pressable>
              </View>

              <PrimaryButton label="Login" onPress={handleLogin} loading={busy} size="lg" style={{ marginTop: Spacing.xl }} />

              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="lock-check" color={Colors.success} size={16} />
                <Text style={styles.infoText}>Secured by Supabase Auth · RLS enforced</Text>
              </View>
            </View>

            <View style={styles.testBox}>
              <Text style={styles.testTitle}>Test credentials</Text>
              {(testCreds[role] ?? []).map((line, i) => (
                <Text key={i} style={styles.testLine}>{line}</Text>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.xxl },
  logoBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', fontSize: 16, fontWeight: '700' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  helper: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6, marginBottom: Spacing.xxl, lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: Spacing.xl, ...Shadows.raised },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  input: { marginTop: 8, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  eyeBtn: { position: 'absolute', right: 14, bottom: 14 },
  infoBox: { marginTop: Spacing.lg, backgroundColor: Colors.successBg, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: Colors.success, fontSize: 12, fontWeight: '600', flex: 1 },
  testBox: { marginTop: Spacing.xl, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.lg, padding: Spacing.lg },
  testTitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '800', marginBottom: 8, letterSpacing: 0.4 },
  testLine: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 18 },
});
