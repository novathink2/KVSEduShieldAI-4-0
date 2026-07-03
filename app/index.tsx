// Landing — Role selector. First-time users see splash → welcome → here
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/services/mockData';

const roles: {
  id: Role; title: string; subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradient: [string, string];
}[] = [
  { id: 'parent',     title: 'Parent',         subtitle: 'Stay connected with your child',  icon: 'account-heart',  gradient: ['#0F2A5C', '#2A6FDB'] },
  { id: 'teacher',    title: 'Teacher',        subtitle: 'Manage class effortlessly',       icon: 'book-education', gradient: ['#1B5E3F', '#1FA971'] },
  { id: 'admin',      title: 'Admin',          subtitle: 'School-wide operations',          icon: 'shield-account', gradient: ['#6B3FA0', '#A36BD6'] },
  { id: 'conductor',  title: 'Conductor',      subtitle: 'Bus boarding & safety',           icon: 'bus-clock',      gradient: ['#B45309', '#F59E0B'] },
  { id: 'bus_driver', title: 'Bus Driver',     subtitle: 'Route & trip management',         icon: 'steering',       gradient: ['#064E3B', '#10B981'] },
  { id: 'security',   title: 'Security Guard', subtitle: 'Gate & early pickup management', icon: 'shield-star',    gradient: ['#7F1D1D', '#EF4444'] },
];

export default function LandingScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Image source={require('@/assets/kvs-logo.png')} style={{ width: 80, height: 80 }} contentFit="contain" />
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (user) {
    if (user.role === 'parent') return <Redirect href="/pin" />;
    if (user.role === 'teacher') return <Redirect href="/(teacher)" />;
    if (user.role === 'admin') return <Redirect href="/(admin)" />;
    if (user.role === 'conductor') return <Redirect href="/(conductor)" />;
    if (user.role === 'bus_driver') return <Redirect href="/(bus_driver)" />;
    if (user.role === 'security') return <Redirect href="/(security)" />;
  }

  return (
    <LinearGradient colors={['#081A3D', '#0F2A5C', '#1F4280']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Brand */}
          <View style={styles.brandRow}>
            <Image source={require('@/assets/kvs-logo.png')} style={styles.logo} contentFit="contain" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.brand}>KVS EduShield AI</Text>
              <Text style={styles.brandSub}>Kendriya Vidyalaya Sangathan</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Every Child Safe.{"\n"}Every Parent Informed.</Text>
            <Text style={styles.heroSub}>
              Choose your role to continue. Role-based access keeps every student safe and every workflow simple.
            </Text>
          </View>

          <Text style={styles.section}>Continue as</Text>

          <View style={{ gap: 12 }}>
            {roles.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/login', params: { role: r.id } })}
                style={({ pressed }) => [styles.roleCard, pressed && { transform: [{ scale: 0.98 }] }]}
              >
                <LinearGradient colors={r.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.roleIcon}>
                  <MaterialCommunityIcons name={r.icon} color="#fff" size={24} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleTitle}>{r.title}</Text>
                  <Text style={styles.roleSub}>{r.subtitle}</Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.primary} />
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <MaterialCommunityIcons name="lock-check" size={14} color="rgba(255,255,255,0.7)" />
            <Text style={styles.footerText}>Made by team NovaThink · Secured by Supabase Auth</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl },
  logo: { width: 48, height: 48 },
  brand: { color: '#fff', fontSize: 18, fontWeight: '800' },
  brandSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  hero: { marginVertical: Spacing.lg },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 36 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 22, marginTop: 10 },
  section: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginTop: Spacing.xxl, marginBottom: Spacing.md, textTransform: 'uppercase' },
  roleCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', ...Shadows.raised },
  roleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  roleTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  roleSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xxl, gap: 6 },
  footerText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
});
