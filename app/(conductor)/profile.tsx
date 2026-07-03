// Conductor: Profile editing
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/services/schoolData';

export default function ConductorProfile() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [busNumber, setBusNumber] = useState(user?.busNumber ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!displayName.trim()) { showAlert('Error', 'Name cannot be empty.'); return; }
    setSaving(true);
    const { error } = await updateUserProfile(user!.id, {
      display_name: displayName.trim(), phone: phone.trim(), bus_number: busNumber.trim(),
    });
    setSaving(false);
    if (error) { showAlert('Error', error); return; }
    await refreshProfile();
    showAlert('Saved', 'Profile updated successfully.');
    setEditMode(false);
  };

  const signOut = () => {
    showAlert('Sign out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title="My Profile" />
      </SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: '#F59E0B' }]}>
                <MaterialCommunityIcons name="bus-clock" color="#fff" size={28} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.sub}>{user?.subtitle}</Text>
              </View>
              <Pressable onPress={() => setEditMode(e => !e)} hitSlop={8} style={styles.editBtn}>
                <MaterialCommunityIcons name={editMode ? 'close' : 'pencil'} color={Colors.primary} size={20} />
              </Pressable>
            </View>
          </Card>

          {editMode ? (
            <Card style={{ marginTop: Spacing.lg }}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} placeholder="Your full name" placeholderTextColor={Colors.textMuted} />
              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Phone Number</Text>
              <TextInput value={phone} onChangeText={setPhone} style={styles.input} placeholder="+91 98XXXXXXXX" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />
              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Bus Number / Code</Text>
              <TextInput value={busNumber} onChangeText={setBusNumber} style={styles.input} placeholder="e.g. C001 / Bus 1" placeholderTextColor={Colors.textMuted} />
              <PrimaryButton label={saving ? 'Saving…' : 'Save Changes'} onPress={save} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
            </Card>
          ) : (
            <Card padded={false} style={{ marginTop: Spacing.lg }}>
              <InfoRow icon="bus" label="Bus" value={user?.busNumber ?? 'Not assigned'} />
              <Divider />
              <InfoRow icon="phone" label="Phone" value={user?.phone ?? 'Not set'} />
              <Divider />
              <InfoRow icon="email" label="Email" value={user?.email ?? '—'} />
            </Card>
          )}

          <PrimaryButton label="Sign out" variant="outline" onPress={signOut} style={{ marginTop: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} color={Colors.primary} size={20} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}
function Divider() { return <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg }} />; }

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  editBtn: { padding: 8 },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  input: { marginTop: 8, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: 12 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, width: 70 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
});
