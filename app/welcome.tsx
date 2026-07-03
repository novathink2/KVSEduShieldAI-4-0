// Welcome Screen — onboarding before role selection
// Powered by OnSpace.AI

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

const SLIDES = [
  {
    icon: 'shield-check' as const,
    color: '#1FA971',
    title: 'Every Child Safe',
    body: 'Real-time bus tracking, boarding alerts, and gate security — your child is always protected.',
  },
  {
    icon: 'book-education' as const,
    color: '#2A6FDB',
    title: 'Stay Academic',
    body: 'Attendance, homework, exams, lessons — parents and teachers connected in one app.',
  },
  {
    icon: 'brain' as const,
    color: '#A36BD6',
    title: 'AI-Powered Insights',
    body: 'KVS EduShield AI analyses learning gaps and provides smart recommendations for every student.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <LinearGradient colors={['#081A3D', '#0F2A5C', '#1F4280']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image source={require('@/assets/kvs-logo.png')} style={styles.logo} contentFit="contain" />
          <View>
            <Text style={styles.brand}>KVS EduShield AI</Text>
            <Text style={styles.brandSub}>Kendriya Vidyalaya Sangathan</Text>
          </View>
        </View>

        {/* Feature cards */}
        <View style={styles.cards}>
          {SLIDES.map((s, i) => (
            <View key={i} style={styles.card}>
              <View style={[styles.iconCircle, { backgroundColor: s.color + '22' }]}>
                <MaterialCommunityIcons name={s.icon} color={s.color} size={28} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardBody}>{s.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stats strip */}
        <View style={styles.stats}>
          <StatItem value="6" label="Roles" />
          <View style={styles.statDiv} />
          <StatItem value="100+" label="Students" />
          <View style={styles.statDiv} />
          <StatItem value="AI" label="Powered" />
          <View style={styles.statDiv} />
          <StatItem value="Secure" label="RLS Auth" />
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
          >
            <LinearGradient colors={[Colors.saffron, '#FF5500']} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.ctaText}>Get Started</Text>
              <MaterialCommunityIcons name="arrow-right" color="#fff" size={22} />
            </LinearGradient>
          </Pressable>
          <Text style={styles.footer}>Made by team NovaThink · Secured by Supabase</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, gap: 12, marginTop: 8 },
  logo: { width: 52, height: 52 },
  brand: { color: '#fff', fontSize: 17, fontWeight: '800' },
  brandSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
  cards: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: 8, gap: 12 },
  card: { backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: Radius.lg, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  iconCircle: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cardBody: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 19, marginTop: 4 },
  stats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: Spacing.xl, borderRadius: Radius.lg, paddingVertical: 14, marginBottom: Spacing.xl },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 2 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 6 },
  cta: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, gap: 12 },
  ctaBtn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadows.raised },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  footer: { textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
});
