// Parent Profile — full editing: name, phone, relationship details
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

const RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Grand Parent', 'Uncle/Aunt', 'Other'];

export default function ParentProfile() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [relationship, setRelationship] = useState('Father');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const signOut = () => {
    showAlert('Sign out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  const saveProfile = async () => {
    if (!displayName.trim()) { showAlert('Missing name', 'Name cannot be empty.'); return; }
    setSaving(true);
    const subtitle = `${relationship} of ${user?.studentName ?? 'Student'} · ${user?.section ?? ''}`;
    const { error } = await updateUserProfile(user!.id, {
      display_name: displayName.trim(),
      phone: phone.trim(),
      subtitle,
    });
    setSaving(false);
    if (error) { showAlert('Error', error); return; }
    await refreshProfile();
    showAlert('Profile updated', 'Your profile has been saved.');
    setEditMode(false);
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
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account-heart" color="#fff" size={28} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.sub}>{user?.subtitle}</Text>
              </View>
              <Pressable onPress={() => setEditMode(e => !e)} style={styles.editBtn} hitSlop={8}>
                <MaterialCommunityIcons name={editMode ? 'close' : 'pencil'} color={Colors.primary} size={20} />
              </Pressable>
            </View>
          </Card>

          {/* Child info card */}
          <Text style={styles.section}>Child's Details</Text>
          <Card padded={false}>
            <InfoRow icon="account-school" label="Student" value={user?.studentName ?? '—'} />
            <Divider />
            <InfoRow icon="google-classroom" label="Section" value={user?.section ?? '—'} />
            <Divider />
            <InfoRow icon="card-account-details" label="Adm No" value={user?.admissionNo ?? '—'} />
          </Card>

          {editMode ? (
            <>
              <Text style={styles.section}>Edit Profile</Text>
              <Card>
                <Text style={styles.formLabel}>Your Full Name</Text>
                <TextInput value={displayName} onChangeText={setDisplayName} style={styles.formInput} placeholderTextColor={Colors.textMuted} placeholder="Your name" />

                <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Relationship to Child</Text>
                <View style={styles.chips}>
                  {RELATIONSHIPS.map(r => (
                    <Pressable key={r} onPress={() => setRelationship(r)} style={[styles.chip, relationship === r && styles.chipActive]}>
                      <Text style={[styles.chipText, relationship === r && styles.chipTextActive]}>{r}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Primary Phone</Text>
                <TextInput value={phone} onChangeText={setPhone} style={styles.formInput} placeholderTextColor={Colors.textMuted} placeholder="+91 98XXXXXXXX" keyboardType="phone-pad" />

                <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Alternate Phone (optional)</Text>
                <TextInput value={altPhone} onChangeText={setAltPhone} style={styles.formInput} placeholderTextColor={Colors.textMuted} placeholder="+91 98XXXXXXXX" keyboardType="phone-pad" />

                <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Home Address (optional)</Text>
                <TextInput value={address} onChangeText={setAddress} style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]} placeholderTextColor={Colors.textMuted} placeholder="House no, Street, Area, City" multiline />

                <PrimaryButton label={saving ? 'Saving…' : 'Save Changes'} onPress={saveProfile} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
              </Card>
            </>
          ) : (
            <>
              <Text style={styles.section}>Contact Info</Text>
              <Card padded={false}>
                <InfoRow icon="phone" label="Phone" value={user?.phone ?? 'Not set'} />
                <Divider />
                <InfoRow icon="email" label="Email" value={user?.email ?? '—'} />
              </Card>

              <Text style={styles.section}>Quick links</Text>
              <Card padded={false}>
                <Item icon="bus-clock" label="Bus Safety Tracker" tint={Colors.info} bg={Colors.infoBg} onPress={() => router.push('/(parent)/safety')} />
                <Divider />
                <Item icon="calendar-check" label="Attendance" tint={Colors.success} bg={Colors.successBg} onPress={() => router.push('/(parent)/attendance')} />
                <Divider />
                <Item icon="book-education" label="Academic Progress" tint={Colors.primary} bg={Colors.surfaceTint} onPress={() => router.push('/(parent)/academic')} />
                <Divider />
                <Item icon="car-arrow-right" label="Request Early Pickup" tint={Colors.warning} bg={Colors.warningBg} onPress={() => router.push('/(parent)/safety')} />
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
  avatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  editBtn: { padding: 8 },
  section: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.8, marginTop: Spacing.xl, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  formInput: { marginTop: 8, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: 12 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, width: 70 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: 12 },
  itemIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
});
