// Admin: Teacher Management — Add, Edit (full details), Delete teachers
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAlert } from '@/template';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { getSupabaseClient } from '@/template';
import { TEACHERS } from '@/services/mockData';

const supabase = getSupabaseClient();

const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Economics', 'Work Education', 'Art Education'];
const SECTIONS = ['10A', '10B', '10C', '10D', '11A', '11B', '12A', '12B'];
const DESIGNATIONS = ['PGT', 'TGT', 'PRT', 'Librarian', 'PET'];

interface TeacherRow {
  id: string;
  email: string;
  display_name: string;
  subtitle: string;
  phone: string;
  employee_code: string;
  subject: string;
  class_teacher_of: string;
  role: string;
  is_active: boolean;
}

export default function AdminTeachers() {
  const { showAlert } = useAlert();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [designation, setDesignation] = useState('TGT');
  const [subject, setSubject] = useState('Mathematics');
  const [classOf, setClassOf] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => { loadTeachers(); }, []);

  const loadTeachers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('id, email, display_name, subtitle, phone, employee_code, subject, class_teacher_of, role, is_active')
      .in('role', ['teacher', 'admin'])
      .eq('is_active', true)
      .order('display_name');
    setTeachers((data as TeacherRow[]) ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditTeacher(null);
    setDisplayName(''); setEmpCode(''); setDesignation('TGT');
    setSubject('Mathematics'); setClassOf(''); setPhone('');
    setShowForm(true);
  };

  const openEdit = (t: TeacherRow) => {
    setEditTeacher(t);
    setDisplayName(t.display_name ?? '');
    setEmpCode(t.employee_code ?? '');
    setDesignation(t.subtitle?.split(' ')[0] ?? 'TGT');
    setSubject(t.subject ?? 'Mathematics');
    setClassOf(t.class_teacher_of ?? '');
    setPhone(t.phone ?? '');
    setShowForm(true);
  };

  const submit = async () => {
    if (!displayName.trim() || !empCode.trim()) {
      showAlert('Missing fields', 'Enter name and employee code.');
      return;
    }
    setSaving(true);
    const subtitle = `${designation} ${subject}${classOf ? ` · Class Teacher ${classOf}` : ''}`;
    if (editTeacher) {
      const { error } = await supabase.from('user_profiles').update({
        display_name: displayName.trim(),
        employee_code: empCode.trim(),
        subtitle,
        subject: subject.trim(),
        class_teacher_of: classOf.trim() || null,
        phone: phone.trim(),
      }).eq('id', editTeacher.id);
      if (error) { showAlert('Error', error.message); setSaving(false); return; }
    } else {
      // Create auth user first via signUp (they'll login first time with default password)
      const email = `${empCode.trim().toLowerCase()}@kvs.in`;
      const password = `Kvpatm2.${empCode.trim()}`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { role: 'teacher' } }
      });
      if (signUpError && !signUpError.message.includes('already registered')) {
        showAlert('Error', signUpError.message); setSaving(false); return;
      }
      // Upsert profile
      const userId = authData?.user?.id;
      if (userId) {
        await supabase.from('user_profiles').upsert({
          id: userId, email,
          display_name: displayName.trim(),
          employee_code: empCode.trim(),
          subtitle, subject: subject.trim(),
          class_teacher_of: classOf.trim() || null,
          phone: phone.trim(),
          role: 'teacher', is_active: true,
        });
      }
    }
    setSaving(false);
    showAlert('Saved', `${displayName} · ${subject}`);
    setShowForm(false);
    loadTeachers();
  };

  const deleteTeacher = (t: TeacherRow) => {
    showAlert(
      'Delete teacher?',
      `Remove ${t.display_name} from the system? This is a soft delete.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            await supabase.from('user_profiles').update({ is_active: false }).eq('id', t.id);
            loadTeachers();
            showAlert('Deleted', `${t.display_name} removed.`);
          },
        },
      ]
    );
  };

  const filtered = teachers.filter(t =>
    !search.trim() ||
    (t.display_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.employee_code ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.subject ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title="Teacher Management" subtitle={`${teachers.length} teachers`} />
      </SafeAreaView>

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" color={Colors.textMuted} size={18} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search by name, code or subject…"
          placeholderTextColor={Colors.textMuted} style={styles.searchInput} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 16, fontWeight: '600' }}>No teachers found</Text>
              <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 8 }}>Tap + to add from the seeded list or add manually</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.teacherCard}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.display_name ?? 'T')[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.teacherName} numberOfLines={1}>{item.display_name ?? '—'}</Text>
                  <Text style={styles.teacherSub} numberOfLines={1}>{item.subtitle ?? item.subject ?? '—'}</Text>
                  {item.employee_code ? <Text style={styles.teacherCode}>Code: {item.employee_code}</Text> : null}
                </View>
                {item.class_teacher_of ? <Pill label={`CT ${item.class_teacher_of}`} tone="success" /> : null}
              </View>
              <View style={styles.actionBtns}>
                <Pressable onPress={() => openEdit(item)} style={styles.editBtn}>
                  <MaterialCommunityIcons name="pencil" color={Colors.info} size={14} />
                  <Text style={[styles.editBtnText, { color: Colors.info }]}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => deleteTeacher(item)} style={styles.delBtn}>
                  <MaterialCommunityIcons name="delete-outline" color={Colors.danger} size={14} />
                  <Text style={[styles.editBtnText, { color: Colors.danger }]}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
          ListHeaderComponent={
            <View style={styles.seedBanner}>
              <MaterialCommunityIcons name="information" color={Colors.info} size={14} />
              <Text style={styles.seedText}>
                Teachers from the PDF roster are pre-seeded. First login auto-creates account with default password Kvpatm2.&lt;code&gt;
              </Text>
            </View>
          }
        />
      )}

      <Pressable onPress={openAdd} style={styles.fab}>
        <MaterialCommunityIcons name="plus" color="#fff" size={28} />
      </Pressable>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editTeacher ? 'Edit Teacher' : 'Add Teacher'}</Text>
              <Pressable onPress={() => setShowForm(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" color={Colors.textSecondary} size={24} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput value={displayName} onChangeText={setDisplayName} placeholder="e.g. JINI P" placeholderTextColor={Colors.textMuted} style={styles.formInput} />

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Employee Code</Text>
              <TextInput value={empCode} onChangeText={setEmpCode} placeholder="e.g. 79553" placeholderTextColor={Colors.textMuted} style={styles.formInput} keyboardType="number-pad" editable={!editTeacher} />
              {!editTeacher && <Text style={styles.hint}>Default password: Kvpatm2.&lt;code&gt;</Text>}

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Designation</Text>
              <View style={styles.chips}>
                {DESIGNATIONS.map(d => (
                  <Pressable key={d} onPress={() => setDesignation(d)} style={[styles.chip, designation === d && styles.chipActive]}>
                    <Text style={[styles.chipText, designation === d && styles.chipTextActive]}>{d}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Subject</Text>
              <View style={styles.chips}>
                {SUBJECTS.map(s => (
                  <Pressable key={s} onPress={() => setSubject(s)} style={[styles.chip, subject === s && styles.chipActive]}>
                    <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>

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

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Phone</Text>
              <TextInput value={phone} onChangeText={setPhone} placeholder="+91 98XXXXXXXX" placeholderTextColor={Colors.textMuted} style={styles.formInput} keyboardType="phone-pad" />

              <PrimaryButton label={editTeacher ? 'Update Teacher' : 'Add Teacher'} onPress={submit} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.xl, marginVertical: Spacing.md, backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  seedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: Colors.infoBg, borderRadius: Radius.md, padding: 10, marginBottom: Spacing.md },
  seedText: { flex: 1, fontSize: 11, color: Colors.info, fontWeight: '600', lineHeight: 16 },
  teacherCard: { paddingVertical: 10, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  teacherName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  teacherSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  teacherCode: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  actionBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.infoBg, borderRadius: Radius.sm },
  delBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.dangerBg, borderRadius: Radius.sm },
  editBtnText: { fontSize: 12, fontWeight: '700' },
  fab: { position: 'absolute', right: 24, bottom: 32, width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.raised },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  form: { padding: Spacing.xl, paddingBottom: 60 },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  formInput: { marginTop: 8, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
});
