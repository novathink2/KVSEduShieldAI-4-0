// Universal Profile Editor — all roles, full profile including address, email, password
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { updateUserProfile, changeUserEmail, changeUserPassword } from '@/services/schoolData';

const ROLE_COLORS: Record<string, string> = {
  parent: '#2A6FDB',
  teacher: '#1FA971',
  admin: '#A36BD6',
  conductor: '#F59E0B',
  bus_driver: '#10B981',
  security: '#EF4444',
};

const ROLE_ICONS: Record<string, string> = {
  parent: 'account-heart',
  teacher: 'book-education',
  admin: 'shield-account',
  conductor: 'bus-clock',
  bus_driver: 'steering',
  security: 'shield-star',
};

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'security'>('basic');

  const [displayName, setDisplayName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState('');
  const [subtitle, setSubtitle] = useState(user?.subtitle ?? '');
  const [newEmail, setNewEmail] = useState(user?.email ?? '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const roleColor = ROLE_COLORS[user?.role ?? 'teacher'] ?? Colors.primary;
  const roleIcon = ROLE_ICONS[user?.role ?? 'teacher'] ?? 'account';

  const save = async () => {
    if (!displayName.trim()) { showAlert('Error', 'Name cannot be empty.'); return; }
    setSaving(true);

    const profileUpdates: Record<string, any> = {
      display_name: displayName.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
    };

    // Role-specific subtitle
    if (user?.role === 'security') {
      profileUpdates.subtitle = `Security Guard · ${subtitle || 'Main Gate'}`;
    } else if (subtitle.trim()) {
      profileUpdates.subtitle = subtitle.trim();
    }

    const { error } = await updateUserProfile(user!.id, profileUpdates);
    setSaving(false);
    if (error) { showAlert('Error', error); return; }

    // Update email if changed
    if (newEmail.trim() && newEmail.trim() !== user?.email) {
      const { error: emailErr } = await changeUserEmail(newEmail.trim());
      if (emailErr) {
        showAlert('Email update failed', emailErr);
        return;
      }
      profileUpdates.email = newEmail.trim();
      await updateUserProfile(user!.id, { email: newEmail.trim() });
    }

    await refreshProfile();
    showAlert('Saved', 'Your profile has been updated successfully.');
    setEditMode(false);
  };

  const changePassword = async () => {
    if (!newPass.trim()) { showAlert('Error', 'Enter a new password.'); return; }
    if (newPass !== confirmPass) { showAlert('Error', 'Passwords do not match.'); return; }
    if (newPass.length < 6) { showAlert('Error', 'Password must be at least 6 characters.'); return; }
    setSaving(true);
    const { error } = await changeUserPassword(newPass);
    setSaving(false);
    if (error) { showAlert('Error', error); return; }
    showAlert('Done', 'Password updated successfully.');
    setNewPass(''); setConfirmPass(''); setCurrentPass('');
  };

  const signOut = () => {
    showAlert('Sign out?', 'You will be returned to the login screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/');
        }
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title="My Profile" />
      </SafeAreaView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar + role */}
          <Card style={styles.heroCard}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.avatar, { backgroundColor: roleColor }]}>
                <MaterialCommunityIcons name={roleIcon as any} color="#fff" size={34} />
              </View>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.sub}>{user?.subtitle}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleColor + '18' }]}>
                <Text style={[styles.roleText, { color: roleColor }]}>{(user?.role ?? '').toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="email" color={Colors.textMuted} size={14} />
                <Text style={styles.metaText} numberOfLines={1}>{user?.email}</Text>
              </View>
              {user?.phone && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="phone" color={Colors.textMuted} size={14} />
                  <Text style={styles.metaText}>{user.phone}</Text>
                </View>
              )}
            </View>
            <Pressable onPress={() => setEditMode(e => !e)} style={styles.editToggle}>
              <MaterialCommunityIcons name={editMode ? 'close' : 'pencil'} color={Colors.primary} size={16} />
              <Text style={styles.editToggleText}>{editMode ? 'Cancel' : 'Edit Profile'}</Text>
            </Pressable>
          </Card>

          {editMode && (
            <>
              {/* Section tabs */}
              <View style={styles.tabRow}>
                {(['basic', 'contact', 'security'] as const).map(tab => (
                  <Pressable key={tab} onPress={() => setActiveSection(tab)}
                    style={[styles.tab, activeSection === tab && styles.tabActive]}>
                    <Text style={[styles.tabText, activeSection === tab && styles.tabTextActive]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {activeSection === 'basic' && (
                <Card style={styles.sectionCard}>
                  <FormField label="Full Name" value={displayName} onChange={setDisplayName} />
                  <FormField label={user?.role === 'security' ? 'Gate Assignment' : 'Designation / Subtitle'} value={subtitle} onChange={setSubtitle} />
                  <PrimaryButton label={saving ? 'Saving…' : 'Save Basic Info'} onPress={save} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
                </Card>
              )}

              {activeSection === 'contact' && (
                <Card style={styles.sectionCard}>
                  <FormField label="Phone Number" value={phone} onChange={setPhone} keyboard="phone-pad" />
                  <FormField label="Address" value={address} onChange={setAddress} multiline />
                  <View style={styles.noteBox}>
                    <MaterialCommunityIcons name="information" color={Colors.info} size={14} />
                    <Text style={styles.noteText}>Email update requires re-verification. A confirmation link will be sent to new email.</Text>
                  </View>
                  <FormField label="New Email Address" value={newEmail} onChange={setNewEmail} keyboard="email-address" />
                  <PrimaryButton label={saving ? 'Saving…' : 'Update Contact Info'} onPress={save} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
                </Card>
              )}

              {activeSection === 'security' && (
                <Card style={styles.sectionCard}>
                  <View style={styles.warningBox}>
                    <MaterialCommunityIcons name="lock-alert" color={Colors.warning} size={16} />
                    <Text style={styles.warningText}>Choose a strong password. Minimum 6 characters.</Text>
                  </View>
                  <View style={styles.passWrap}>
                    <FormField label="New Password" value={newPass} onChange={setNewPass} secure={!showPass} />
                    <Pressable onPress={() => setShowPass(p => !p)} style={styles.eyeBtn} hitSlop={8}>
                      <MaterialCommunityIcons name={showPass ? 'eye-off' : 'eye'} color={Colors.textMuted} size={20} />
                    </Pressable>
                  </View>
                  <FormField label="Confirm Password" value={confirmPass} onChange={setConfirmPass} secure={!showPass} />
                  <PrimaryButton label={saving ? 'Updating…' : 'Change Password'} onPress={changePassword} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
                </Card>
              )}
            </>
          )}

          {/* Info card when not editing */}
          {!editMode && (
            <Card padded={false} style={{ marginTop: Spacing.lg }}>
              {user?.employeeCode && (
                <InfoRow icon="badge-account" label="Code" value={user.employeeCode} />
              )}
              {user?.classTeacherOf && (
                <InfoRow icon="account-group" label="Class Teacher Of" value={`Class ${user.classTeacherOf}`} />
              )}
              {user?.subject && (
                <InfoRow icon="book" label="Subject" value={user.subject} />
              )}
              {user?.busNumber && (
                <InfoRow icon="bus" label="Bus" value={user.busNumber} />
              )}
              {user?.gate && (
                <InfoRow icon="gate" label="Gate" value={user.gate} />
              )}
            </Card>
          )}

          <PrimaryButton label="Sign out" variant="outline" onPress={signOut} style={{ marginTop: Spacing.xl }} />
          <Text style={styles.footer}>Made by team NovaThink</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FormField({ label, value, onChange, keyboard, multiline, secure, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  keyboard?: any; multiline?: boolean; secure?: boolean; placeholder?: string;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={fStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ?? 'default'}
        secureTextEntry={secure}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholder={placeholder ?? ''}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        style={[fStyles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={fStyles.infoRow}>
      <MaterialCommunityIcons name={icon as any} color={Colors.primary} size={18} />
      <Text style={fStyles.infoLabel}>{label}</Text>
      <Text style={fStyles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const fStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { marginTop: 6, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, width: 120 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  heroCard: { alignItems: 'stretch' },
  avatar: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  sub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginTop: 8 },
  roleText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  metaRow: { marginTop: 14, gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  editToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  editToggleText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.lg },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  sectionCard: { marginTop: Spacing.lg },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.infoBg, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.lg },
  noteText: { flex: 1, fontSize: 12, color: Colors.info, fontWeight: '600', lineHeight: 18 },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.warningBg, borderRadius: Radius.md, padding: Spacing.md },
  warningText: { flex: 1, fontSize: 12, color: Colors.warning, fontWeight: '600', lineHeight: 18 },
  passWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, bottom: 14 },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: Spacing.xl },
});
