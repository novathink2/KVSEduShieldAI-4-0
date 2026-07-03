// Parent profile — with safety PIN management and student photo upload
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '@/components/ui/Card';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile, changeUserEmail, changeUserPassword, fetchParentStudent, updateStudentDetails } from '@/services/schoolData';
import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

export default function ParentProfile() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState('');
  const [newEmail, setNewEmail] = useState(user?.email ?? '');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [tab, setTab] = useState<'profile' | 'security'>('profile');

  useEffect(() => { loadStudent(); }, [user?.id]);

  const loadStudent = async () => {
    if (!user?.id) return;
    const s = await fetchParentStudent(user.id);
    setStudent(s);
    setLoadingStudent(false);
  };

  const save = async () => {
    if (!displayName.trim()) { showAlert('Error', 'Name cannot be empty.'); return; }
    setSaving(true);
    await updateUserProfile(user!.id, {
      display_name: displayName.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
    });
    if (newEmail.trim() && newEmail.trim() !== user?.email) {
      await changeUserEmail(newEmail.trim());
      await updateUserProfile(user!.id, { email: newEmail.trim() });
    }
    await refreshProfile();
    setSaving(false);
    showAlert('Saved', 'Profile updated.');
    setEditMode(false);
  };

  const changePassword = async () => {
    if (!newPass || newPass !== confirmPass) { showAlert('Error', 'Passwords do not match.'); return; }
    if (newPass.length < 6) { showAlert('Error', 'Minimum 6 characters required.'); return; }
    setSaving(true);
    const { error } = await changeUserPassword(newPass);
    setSaving(false);
    if (error) { showAlert('Error', error); return; }
    showAlert('Done', 'Password changed successfully.');
    setNewPass(''); setConfirmPass('');
  };

  const pickStudentPhoto = async () => {
    if (!student) { showAlert('No student linked', 'Your account is not linked to a student yet.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    const fileName = `students/${student.id}.${ext}`;

    const base64 = asset.base64;
    const arrayBuffer = base64
      ? Uint8Array.from(atob(base64), c => c.charCodeAt(0))
      : null;

    if (!arrayBuffer) { showAlert('Error', 'Could not read image.'); return; }

    setSaving(true);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-photos')
      .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });

    if (uploadError) {
      // Try to create bucket if not exists
      await supabase.storage.createBucket('student-photos', { public: true });
      await supabase.storage.from('student-photos').upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
    }

    const { data: urlData } = supabase.storage.from('student-photos').getPublicUrl(fileName);
    if (urlData?.publicUrl) {
      await updateStudentDetails(student.id, { profile_photo: urlData.publicUrl });
      setStudent((s: any) => s ? { ...s, profile_photo: urlData.publicUrl } : s);
      showAlert('Photo updated', "Your child's profile photo has been updated.");
    }
    setSaving(false);
  };

  const resetPin = async () => {
    showAlert('Reset Safety PIN?', 'You will be asked to create a new PIN on next login.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          await supabase.from('user_profiles').update({ safety_pin: null }).eq('id', user!.id);
          showAlert('PIN Reset', 'Your safety PIN has been cleared. You will set a new one at next login.');
        }
      },
    ]);
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Student Card */}
          <Card style={styles.studentCard}>
            <Text style={styles.sectionTitle}>My Child</Text>
            {loadingStudent ? <ActivityIndicator color={Colors.primary} /> : student ? (
              <View style={styles.studentRow}>
                <Pressable onPress={pickStudentPhoto} style={styles.photoWrap}>
                  {student.profile_photo ? (
                    <Image source={{ uri: student.profile_photo }} style={styles.studentPhoto} contentFit="cover" />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <MaterialCommunityIcons name="camera-plus" color={Colors.textMuted} size={24} />
                    </View>
                  )}
                  <View style={styles.cameraBadge}>
                    <MaterialCommunityIcons name="camera" color="#fff" size={10} />
                  </View>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentMeta}>Section: {student.section}</Text>
                  <Text style={styles.studentMeta}>Adm: {student.admission_no}</Text>
                  {student.pen_no && <Text style={[styles.studentMeta, { color: Colors.info }]}>PEN: {student.pen_no}</Text>}
                </View>
              </View>
            ) : (
              <Text style={{ color: Colors.textMuted, fontSize: 13 }}>No student linked to this account yet.</Text>
            )}
          </Card>

          {/* Profile card */}
          <Card style={{ marginTop: Spacing.lg }}>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: '#2A6FDB' }]}>
                <MaterialCommunityIcons name="account-heart" color="#fff" size={26} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
              </View>
              <Pressable onPress={() => setEditMode(e => !e)} style={styles.editBtn}>
                <MaterialCommunityIcons name={editMode ? 'close' : 'pencil'} color={Colors.primary} size={20} />
              </Pressable>
            </View>
          </Card>

          {editMode && (
            <>
              <View style={styles.tabRow}>
                <Pressable onPress={() => setTab('profile')} style={[styles.tab, tab === 'profile' && styles.tabActive]}>
                  <Text style={[styles.tabText, tab === 'profile' && styles.tabTextActive]}>Profile</Text>
                </Pressable>
                <Pressable onPress={() => setTab('security')} style={[styles.tab, tab === 'security' && styles.tabActive]}>
                  <Text style={[styles.tabText, tab === 'security' && styles.tabTextActive]}>Security</Text>
                </Pressable>
              </View>

              {tab === 'profile' && (
                <Card style={styles.formCard}>
                  <FField label="Your Name" value={displayName} onChange={setDisplayName} />
                  <FField label="Phone" value={phone} onChange={setPhone} keyboard="phone-pad" />
                  <FField label="Address" value={address} onChange={setAddress} multiline />
                  <FField label="New Email" value={newEmail} onChange={setNewEmail} keyboard="email-address" />
                  <PrimaryButton label={saving ? 'Saving…' : 'Save Changes'} onPress={save} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
                </Card>
              )}

              {tab === 'security' && (
                <Card style={styles.formCard}>
                  <View style={styles.pinRow}>
                    <MaterialCommunityIcons name="lock" color={Colors.primary} size={20} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.pinTitle}>Safety PIN</Text>
                      <Text style={styles.pinSub}>Required every time you open the parent app</Text>
                    </View>
                    <Pressable onPress={resetPin} style={styles.resetPinBtn}>
                      <Text style={styles.resetPinText}>Reset PIN</Text>
                    </Pressable>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.passTitle}>Change Password</Text>
                  <View style={styles.passWrap}>
                    <FField label="New Password" value={newPass} onChange={setNewPass} secure={!showPass} />
                    <Pressable onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                      <MaterialCommunityIcons name={showPass ? 'eye-off' : 'eye'} color={Colors.textMuted} size={20} />
                    </Pressable>
                  </View>
                  <FField label="Confirm Password" value={confirmPass} onChange={setConfirmPass} secure={!showPass} />
                  <PrimaryButton label={saving ? 'Updating…' : 'Change Password'} onPress={changePassword} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
                </Card>
              )}
            </>
          )}

          <PrimaryButton label="Sign out" variant="outline" onPress={signOut} style={{ marginTop: Spacing.xl }} />
          <Text style={styles.footer}>Made by team NovaThink</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FField({ label, value, onChange, keyboard, multiline, secure }: {
  label: string; value: string; onChange: (v: string) => void;
  keyboard?: any; multiline?: boolean; secure?: boolean;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={fS.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboard ?? 'default'}
        secureTextEntry={secure} multiline={multiline} numberOfLines={multiline ? 3 : 1}
        placeholderTextColor={Colors.textMuted} autoCapitalize="none"
        style={[fS.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]} />
    </View>
  );
}

const fS = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { marginTop: 6, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  studentCard: {},
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoWrap: { position: 'relative' },
  studentPhoto: { width: 64, height: 64, borderRadius: 16 },
  photoPlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  studentName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  studentMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  email: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  editBtn: { padding: 8 },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.lg },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  formCard: { marginTop: Spacing.lg },
  passTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginTop: 16 },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, bottom: 14 },
  pinRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  pinTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  pinSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  resetPinBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.dangerBg, borderRadius: Radius.pill },
  resetPinText: { fontSize: 12, fontWeight: '700', color: Colors.danger },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: Spacing.xl },
});
