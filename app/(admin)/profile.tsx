// Admin Profile — full editing of all profile fields
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

export default function AdminProfile() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [empCode, setEmpCode] = useState(user?.employeeCode ?? '');
  const [subtitle, setSubtitle] = useState(user?.subtitle ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!displayName.trim()) { showAlert('Error', 'Name cannot be empty.'); return; }
    setSaving(true);
    const { error } = await updateUserProfile(user!.id, {
      display_name: displayName.trim(),
      phone: phone.trim(),
      employee_code: empCode.trim(),
      subtitle: subtitle.trim(),
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
        <ScreenHeader title="Admin Profile" />
      </SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: '#6B3FA0' }]}>
                <MaterialCommunityIcons name="shield-account" color="#fff" size={28} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.sub}>{user?.subtitle}</Text>
                {user?.employeeCode ? <Text style={styles.code}>Emp Code: {user.employeeCode}</Text> : null}
              </View>
              <Pressable onPress={() => setEditMode(e => !e)} hitSlop={8} style={styles.editBtn}>
                <MaterialCommunityIcons name={editMode ? 'close' : 'pencil'} color={Colors.primary} size={20} />
              </Pressable>
            </View>
          </Card>

          {editMode ? (
            <Card style={{ marginTop: Spacing.lg }}>
              <Text style={styles.sectionHeader}>Edit Profile</Text>

              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} placeholder="Your full name" placeholderTextColor={Colors.textMuted} />

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Designation / Title</Text>
              <TextInput value={subtitle} onChangeText={setSubtitle} style={styles.input} placeholder="e.g. Principal / Vice Principal" placeholderTextColor={Colors.textMuted} />

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Employee Code</Text>
              <TextInput value={empCode} onChangeText={setEmpCode} style={styles.input} placeholder="e.g. 21160" placeholderTextColor={Colors.textMuted} keyboardType="number-pad" />

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Phone Number</Text>
              <TextInput value={phone} onChangeText={setPhone} style={styles.input} placeholder="+91 98XXXXXXXX" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

              <PrimaryButton label={saving ? 'Saving…' : 'Save Changes'} onPress={save} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
            </Card>
          ) : (
            <>
              <Text style={styles.sectionTitle}>My Info</Text>
              <Card padded={false}>
                <InfoRow icon="account-tie" label="Role" value="Administrator" />
                <Divider />
                <InfoRow icon="identifier" label="Emp Code" value={user?.employeeCode ?? '—'} />
                <Divider />
                <InfoRow icon="phone" label="Phone" value={user?.phone ?? 'Not set'} />
                <Divider />
                <InfoRow icon="email" label="Email" value={user?.email ?? '—'} />
              </Card>

              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <Card padded={false}>
                <Item icon="account-group" label="Manage Students" tint={Colors.primary} bg={Colors.surfaceTint} onPress={() => router.push('/(admin)/students')} />
                <Divider />
                <Item icon="account-tie" label="Manage Teachers" tint={Colors.success} bg={Colors.successBg} onPress={() => router.push('/(admin)/teachers')} />
                <Divider />
                <Item icon="timetable" label="Timetable Manager" tint={Colors.info} bg={Colors.infoBg} onPress={() => router.push('/(admin)/timetable')} />
                <Divider />
                <Item icon="bus-multiple" label="Fleet Management" tint={Colors.warning} bg={Colors.warningBg} onPress={() => router.push('/(admin)/fleet')} />
                <Divider />
                <Item icon="brain" label="AI Assistant" tint="#6E55C2" bg="#F0ECFD" onPress={() => router.push('/(admin)/ai')} />
              </Card>
            </>
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

function Item({ icon, label, tint, bg, onPress }: { icon: any; label: string; tint: string; bg: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.itemRow} onPress={onPress}>
      <View style={[styles.itemIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} color={tint} size={20} />
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" color={Colors.textMuted} size={20} />
    </Pressable>
  );
}

function Divider() { return <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg }} />; }

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  code: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
  editBtn: { padding: 8 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.8, marginTop: Spacing.xl, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  input: { marginTop: 8, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: 12 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, width: 80 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: 12 },
  itemIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
});
