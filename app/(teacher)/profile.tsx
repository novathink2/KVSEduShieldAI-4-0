// Teacher: Full profile editing — name, phone, subject, employee code, section
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAlert } from '@/template';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile } from '@/services/schoolData';

const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Economics', 'Work Education', 'Art Education'];
const SECTIONS = ['10A', '10B', '10C', '10D', '11A', '11B', '12A', '12B'];

export default function TeacherProfile() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [subject, setSubject] = useState(user?.subject ?? 'Mathematics');
  const [classOf, setClassOf] = useState(user?.classTeacherOf ?? '');
  const [empCode, setEmpCode] = useState(user?.employeeCode ?? '');
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
    const subtitle = `${subject}${classOf ? ` · Class Teacher ${classOf}` : ''}`;
    const { error } = await updateUserProfile(user!.id, {
      display_name: displayName.trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      class_teacher_of: classOf.trim() || null,
      employee_code: empCode.trim(),
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
        <ScreenHeader title="Profile" />
      </SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Card>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name ?? 'T')[0]}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.sub}>{user?.subtitle}</Text>
                {user?.employeeCode ? <Text style={styles.code}>Emp Code: {user.employeeCode}</Text> : null}
              </View>
              <Pressable onPress={() => setEditMode(e => !e)} style={styles.editBtn} hitSlop={8}>
                <MaterialCommunityIcons name={editMode ? 'close' : 'pencil'} color={Colors.primary} size={20} />
              </Pressable>
            </View>
          </Card>

          {editMode ? (
            <>
              <Text style={styles.section}>Edit Profile</Text>
              <Card>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput value={displayName} onChangeText={setDisplayName} style={styles.formInput} placeholderTextColor={Colors.textMuted} placeholder="Your full name" />

                <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Employee Code</Text>
                <TextInput value={empCode} onChangeText={setEmpCode} style={styles.formInput} placeholderTextColor={Colors.textMuted} placeholder="e.g. 79553" keyboardType="number-pad" />

                <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Phone Number</Text>
                <TextInput value={phone} onChangeText={setPhone} style={styles.formInput} placeholderTextColor={Colors.textMuted} placeholder="+91 98XXXXXXXX" keyboardType="phone-pad" />

                <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
                  {SUBJECTS.map(s => (
                    <Pressable key={s} onPress={() => setSubject(s)} style={[styles.chip, subject === s && styles.chipActive]}>
                      <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Class Teacher Of (optional)</Text>
                <View style={styles.chips}>
                  <Pressable onPress={() => setClassOf('')} style={[styles.chip, classOf === '' && styles.chipActive]}>
                    <Text style={[styles.chipText, classOf === '' && styles.chipTextActive]}>None</Text>
                  </Pressable>
                  {SECTIONS.map(s => (
                    <Pressable key={s} onPress={() => setClassOf(s)} style={[styles.chip, classOf === s && styles.chipActive]}>
                      <Text style={[styles.chipText, classOf === s && styles.chipTextActive]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>

                <PrimaryButton label={saving ? 'Saving…' : 'Save Changes'} onPress={saveProfile} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
              </Card>
            </>
          ) : (
            <>
              <Text style={styles.section}>My info</Text>
              <Card padded={false}>
                <InfoRow icon="book" label="Subject" value={user?.subject ?? '—'} />
                <Divider />
                <InfoRow icon="google-classroom" label="Class" value={user?.classTeacherOf ? `Class Teacher · ${user.classTeacherOf}` : 'Subject Teacher'} />
                <Divider />
                <InfoRow icon="phone" label="Phone" value={user?.phone ?? 'Not set'} />
                <Divider />
                <InfoRow icon="email" label="Email" value={user?.email ?? '—'} />
              </Card>

              <Text style={styles.section}>Quick actions</Text>
              <Card padded={false}>
                <Item icon="account-group" label="Student Management" tint={Colors.primary} bg={Colors.surfaceTint} onPress={() => router.push('/(teacher)/students')} />
                <Divider />
                <Item icon="alert-octagon" label="Report incident" tint={Colors.danger} bg={Colors.dangerBg} onPress={() => router.push('/(teacher)/incidents')} />
                <Divider />
                <Item icon="clipboard-check" label="Take attendance" tint={Colors.primary} bg={Colors.surfaceTint} onPress={() => router.push('/(teacher)/attendance')} />
                <Divider />
                <Item icon="clipboard-list" label="Exam marks" tint={Colors.info} bg={Colors.infoBg} onPress={() => router.push('/(teacher)/exams')} />
                <Divider />
                <Item icon="brain" label="AI Assistant" tint="#6E55C2" bg="#F0ECFD" onPress={() => router.push('/(teacher)/ai')} />
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
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  code: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontWeight: '600' },
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
