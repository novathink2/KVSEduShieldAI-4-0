// Splash Screen with KVS Logo
// Powered by OnSpace.AI

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      ]),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Image
            source={require('@/assets/kvs-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.appName}>KVS EduShield AI</Text>
          <Text style={styles.tagline}>तत् त्वं पूषन् अपावृणु</Text>
          <Text style={styles.subtitle}>Kendriya Vidyalaya Sangathan</Text>
          <Text style={styles.sub2}>AI-Powered School Management</Text>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <View style={styles.dotRow}>
            <PulseDot delay={0} />
            <PulseDot delay={200} />
            <PulseDot delay={400} />
          </View>
          <Text style={styles.footerText}>Made by team NovaThink</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

function PulseDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  logoWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  logo: { width: 180, height: 180 },
  textWrap: { alignItems: 'center', gap: 6 },
  appName: { fontSize: 24, fontWeight: '900', color: Colors.primaryDark, letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: '#8B1A1A', fontWeight: '700', marginTop: 4 },
  subtitle: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  sub2: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', marginTop: 2 },
  footer: { position: 'absolute', bottom: 60, alignItems: 'center', gap: 10 },
  dotRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  footerText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.3 },
});
