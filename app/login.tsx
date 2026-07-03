// Updated login — teachers use their own email (no auto-generation)
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

const cfg: Record<Role, {
  title: string; helper: string; emailLabel: string; emailPh: string; passPh: string; gradient: [string, string];
}> = {
  parent: {
    title: 'Parent Login',
    helper: 'Enter admission number last 4 digits as username (e.g. 4350)',
    emailLabel: 'Admission No. (last 4 digits)', emailPh: '4350', passPh: 'Pass@4350',
    gradient: ['#0F2A5C', '#2A6FDB'],
  },
  teacher: {
    title: 'Teacher Login',
    helper: 'Enter your official KVS email address and password',
    emailLabel: 'Your KVS Email', emailPh: 'yourname@kvs.in', passPh: 'Your password',
    gradient: ['#1B5E3F', '#1FA971'],
  },
  admin: {
    title: 'Admin Login',
    helper: 'Enter your official KVS admin email and password',
    emailLabel: 'Admin Email', emailPh: 'admin@kvs.in', passPh: 'Your password',
    gradient: ['#6B3FA0', '#A36BD6'],
  },
  conductor: {
    title: 'Conductor Login',
    helper: 'Enter your conductor code (e.g. C001) and password',
    emailLabel: 'Conductor Code', emailPh: 'C001', passPh: 'Cond@C001',
    gradient: ['#B45309', '#F59E0B'],
  },
  bus_driver: {
    title: 'Bus Driver Login',
    helper: 'Enter your driver code (e.g. D001) and password',
    emailLabel: 'Driver Code', emailPh: 'D001', passPh: 'Driver@D001',
    gradient: ['#064E3B', '#10B981'],
  },
  security: {
    title: 'Security Guard Login',
    helper: 'Enter your guard code (e.g. SG001) and password',
    emailLabel: 'Guard Code', emailPh: 'SG001', passPh: 'Security@SG001',
    gradient: ['#7F1D1D', '#EF4444'],
  },
};

function toEmail(role: Role, identifier: string): string {
  const id = identifier.trim().toLowerCase();
  if (role === 'parent') {
    const digits = id.replace(/\D/g, '').slice(-4);
    return `parent.${digits}@kvs.in`;
  }
  if (role === 'conductor') return `conductor.${id}@kvs.in`;
  if (role === 'bus_driver') return `driver.${id}@kvs.in`;
  if (role === 'security') return `security.${id}@kvs.in`;
  // Teacher/Admin: use exactly what they typed (their real email)
  return id.includes('@') ? id : `${id}@kvs.in`;
}

function defaultPass(role: Role, identifier: string): string {
  const id = identifier.trim();
  if (role === 'parent') return `Pass@${id.replace(/\D/g, '').slice(-4)}`;
  if (role === 'conductor') return `Cond@${id}`;
  if (role === 'bus_driver') return `Driver@${id}`;
  if (role === 'security') return `Security@${id}`;
  return '';
}

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
      showAlert('Missing field', `Please enter your ${config.emailLabel.toLowerCase()}.`);
      return;
    }
    const email = toEmail(role, identifier);
    const pass = password.trim() || defaultPass(role, identifier);
    if (!pass) {
      showAlert('Password required', 'Please enter your password.');
      return;
    }
    setBusy(true);
    const { error } = await signInWithPassword(email, pass, role);
    setBusy(false);
    if (error) { showAlert('Login failed', error); return; }
    if (role === 'parent') router.replace('/pin');
    else if (role === 'teacher') router.replace('/(teacher)');
    else if (role === 'admin') router.replace('/(admin)');
    else if (role === 'conductor') router.replace('/(conductor)');
    else if (role === 'bus_driver') router.replace('/(bus_driver)');
    else if (role === 'security') router.replace('/(security)');
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
              <Image source={require('@/assets/kvs-logo.png')} style={styles.logo} contentFit="contain" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.brand}>KVS EduShield AI</Text>
                <Text style={styles.brandSub}>Kendriya Vidyalaya Sangathan</Text>
              </View>
            </View>

            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.helper}>{config.helper}</Text>

            <View style={styles.card}>
              <Text style={styles.label}>{config.emailLabel}</Text>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={config.emailPh}
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="none"
                keyboardType={role === 'parent' ? 'number-pad' : 'email-address'}
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: Spacing.lg }]}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={config.passPh}
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                />
                <Pressable onPress={() => setShowPass(p => !p)} hitSlop={8} style={styles.eyeBtn}>
                  <MaterialCommunityIcons name={showPass ? 'eye-off' : 'eye'} color={Colors.textMuted} size={20} />
                </Pressable>
              </View>

              {(role === 'teacher' || role === 'admin') && (
                <View style={styles.noteBox}>
                  <MaterialCommunityIcons name="information" color={Colors.info} size={14} />
                  <Text style={styles.noteText}>Use your official KVS email. First-time users: account is created automatically. Update your email in Profile after login.</Text>
                </View>
              )}

              <PrimaryButton label="Login" onPress={handleLogin} loading={busy} size="lg" style={{ marginTop: Spacing.xl }} />

              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="lock-check" color={Colors.success} size={16} />
                <Text style={styles.infoText}>Secured by Supabase Auth · RLS enforced</Text>
              </View>
            </View>

            <Text style={styles.footerText}>Made by team NovaThink</Text>
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
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl },
  logo: { width: 48, height: 48 },
  brand: { color: '#fff', fontSize: 17, fontWeight: '800' },
  brandSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  helper: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6, marginBottom: Spacing.xxl, lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: Spacing.xl, ...Shadows.raised },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  input: { marginTop: 8, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  eyeBtn: { position: 'absolute', right: 14, bottom: 14 },
  noteBox: { marginTop: Spacing.md, backgroundColor: Colors.infoBg, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { color: Colors.info, fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 18 },
  infoBox: { marginTop: Spacing.lg, backgroundColor: Colors.successBg, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { color: Colors.success, fontSize: 12, fontWeight: '600', flex: 1 },
  footerText: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', marginTop: Spacing.xl },
});
