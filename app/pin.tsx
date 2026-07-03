// Parent Safety PIN screen — compulsory before accessing parent app
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();
const PIN_LENGTH = 4;

export default function PinScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'set' | 'confirm' | 'enter'>('enter');
  const [tempPin, setTempPin] = useState('');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkPinExists();
  }, []);

  const checkPinExists = async () => {
    // Check if user has set a PIN
    const { data } = await supabase
      .from('user_profiles')
      .select('safety_pin')
      .eq('id', user!.id)
      .single();
    if (!data?.safety_pin) {
      setMode('set');
    } else {
      setMode('enter');
    }
  };

  const shake = () => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = async (d: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const newPin = pin + d;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      await new Promise(r => setTimeout(r, 100));

      if (mode === 'set') {
        setTempPin(newPin);
        setMode('confirm');
        setPin('');
      } else if (mode === 'confirm') {
        if (newPin === tempPin) {
          // Save PIN hash to DB
          await supabase.from('user_profiles').update({ safety_pin: newPin }).eq('id', user!.id);
          router.replace('/(parent)');
        } else {
          shake();
          setError('PINs do not match. Try again.');
          setPin('');
          setTempPin('');
          setMode('set');
        }
      } else {
        // Verify PIN
        const { data } = await supabase
          .from('user_profiles')
          .select('safety_pin')
          .eq('id', user!.id)
          .single();
        if (data?.safety_pin === newPin) {
          router.replace('/(parent)');
        } else {
          shake();
          setError('Incorrect PIN. Try again.');
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const title = mode === 'set' ? 'Create Safety PIN' : mode === 'confirm' ? 'Confirm PIN' : 'Enter Safety PIN';
  const subtitle = mode === 'set'
    ? 'Set a 4-digit PIN to protect your child\'s data'
    : mode === 'confirm'
    ? 'Re-enter PIN to confirm'
    : 'Enter your 4-digit safety PIN';

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center' }}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image source={require('@/assets/kvs-logo.png')} style={styles.logo} contentFit="contain" />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* PIN dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < pin.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : <View style={{ height: 20 }} />}

        {/* Keypad */}
        <View style={styles.keypad}>
          {['1','2','3','4','5','6','7','8','9','','0','del'].map((d, i) => {
            if (d === '') return <View key={i} style={styles.keyEmpty} />;
            if (d === 'del') {
              return (
                <Pressable key={i} onPress={handleDelete} style={({ pressed }) => [styles.key, pressed && styles.keyPressed]} hitSlop={8}>
                  <MaterialCommunityIcons name="backspace-outline" color={Colors.textPrimary} size={24} />
                </Pressable>
              );
            }
            return (
              <Pressable key={i} onPress={() => handleDigit(d)} style={({ pressed }) => [styles.key, pressed && styles.keyPressed]} hitSlop={4}>
                <Text style={styles.keyText}>{d}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Sign out option */}
        <Pressable onPress={async () => { await logout(); router.replace('/'); }} style={styles.signOutBtn}>
          <MaterialCommunityIcons name="logout" color={Colors.textMuted} size={16} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footer}>Made by team NovaThink</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  logoWrap: { marginTop: 32, marginBottom: 24, width: 80, height: 80 },
  logo: { width: 80, height: 80 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  dotsRow: { flexDirection: 'row', gap: 16, marginTop: 32, marginBottom: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotError: { borderColor: Colors.danger, backgroundColor: Colors.dangerBg },
  error: { color: Colors.danger, fontSize: 13, fontWeight: '600', height: 20 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 12, marginTop: 24 },
  key: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  keyPressed: { backgroundColor: Colors.surfaceTint, transform: [{ scale: 0.95 }] },
  keyEmpty: { width: 80, height: 80 },
  keyText: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 32 },
  signOutText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 24, fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
});
