// Admin: Teacher Management — with permanent/contractual filter, date of joining, full edit
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

const supabase = getSupabaseClient();

const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Economics', 'Work Education', 'Art Education', 'Physical Education'];
const SECTIONS = ['10A', '10B', '10C', '10D', '11A', '11B', '12A', '12B'];
const DESIGNATIONS = ['PGT', 'TGT', 'PRT', 'Librarian', 'PET'];
const TEACHER_TYPES = ['Regular', 'Contractual', 'Guest', 'Part-time'] as const;
type TeacherType = typeof TEACHER_TYPES[number];

const TYPE_COLORS: Record<TeacherType, string> = {
  Regular: 'success',
  Contractual: 'warning',
  Guest: 'info',
  'Part-time': 'neutral',
};

export default function AdminTeachers() {
  const { showAlert } = useAlert();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<TeacherType | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [displayName, setDisplayName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [ownEmail, setOwnEmail] = useState('');
  const [designation, setDesignation] = useState('TGT');
  const [subject, setSubject] = useState('Mathematics');
  const [classOf, setClassOf] = useState('');
  const [phone, setPhone] = useState('');
  const [teacherType, setTeacherType] = useState<TeacherType>('Regular');
  const [dateOfJoining, setDateOfJoining] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .in('role', ['teacher', 'admin'])
      .eq('is_active', true)
      .order('display_name');
    setTeachers(data ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditTeacher(null);
    setDisplayName(''); setEmpCode(''); setOwnEmail('');
    setDesignation('TGT'); setSubject('Mathematics');
    setClassOf(''); setPhone(''); setTeacherType('Regular'); setDateOfJoining('');
    setShowForm(true);
  };

  const openEdit = (t: any) => {
    setEditTeacher(t);
    setDisplayName(t.display_name ?? '');
    setEmpCode(t.employee_code ?? '');
    setOwnEmail(t.email ?? '');
    const desg = t.subtitle?.split(' ')[0] ?? 'TGT';
    setDesignation(DESIGNATIONS.includes(desg) ? desg : 'TGT');
    setSubject(t.subject ?? 'Mathematics');
    setClassOf(t.class_teacher_of ?? '');
    setPhone(t.phone ?? '');
    setTeacherType((t.teacher_type as TeacherType) ?? 'Regular');
    setDateOfJoining(t.date_of_joining ?? '');
    setShowForm(true);
  };

  const submit = async () => {
    if (!displayName.trim()) { showAlert('Missing', 'Enter teacher name.'); return; }
    setSaving(true);
    const subtitle = `${designation} ${subject}${classOf ? ` · CT ${classOf}` : ''}${teacherType !== 'Regular' ? ` · ${teacherType}` : ''}`;

    if (editTeacher) {
      const upd: any = {
        display_name: displayName.trim(),
        employee_code: empCode.trim(),
        subtitle, subject, class_teacher_of: classOf || null,
        phone: phone.trim(),
        teacher_type: teacherType,
        date_of_joining: dateOfJoining || null,
      };
      if (ownEmail.trim() && ownEmail.trim() !== editTeacher.email) {
        upd.email = ownEmail.trim();
      }
      await supabase.from('user_profiles').update(upd).eq('id', editTeacher.id);
    } else {
      // Create account with teacher's own email
      const email = ownEmail.trim() || `${empCode.trim().toLowerCase()}@kvs.in`;
      const password = `Kvpatm2.${empCode.trim() || displayName.replace(/\s/g, '').toLowerCase()}`;
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { role: 'teacher' } }
      });
      if (signUpError && !signUpError.message.includes('already registered')) {
        showAlert('Error', signUpError.message); setSaving(false); return;
      }
      const userId = authData?.user?.id;
      if (userId) {
        await supabase.from('user_profiles').upsert({
          id: userId, email,
          display_name: displayName.trim(),
          employee_code: empCode.trim(),
          subtitle, subject, class_teacher_of: classOf || null,
          phone: phone.trim(), role: 'teacher', is_active: true,
          teacher_type: teacherType, date_of_joining: dateOfJoining || null,
        });
      }
    }

    setSaving(false);
    showAlert('Saved', `${displayName} saved.`);
    setShowForm(false);
    load();
  };

  const removeTeacher = (t: any) => {
    showAlert('Remove teacher?', `${t.display_name} will be deactivated.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('user_profiles').update({ is_active: false }).eq('id', t.id);
          load();
          showAlert('Done', `${t.display_name} removed.`);
        }
      },
    ]);
  };

  const filtered = teachers.filter(t => {
    const matchType = filterType === 'All' || (t.teacher_type ?? 'Regular') === filterType;
    const matchSearch = !search.trim() ||
      (t.display_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.employee_code ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.subject ?? '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title="Teachers" subtitle={`${teachers.length} total`} />
      </SafeAreaView>

      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" color={Colors.textMuted} size={18} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search…"
            placeholderTextColor={Colors.textMuted} style={styles.searchInput} />
        </View>
      </View>

      {/* Type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {(['All', ...TEACHER_TYPES] as const).map(t => (
          <Pressable key={t} onPress={() => setFilterType(t as any)}
            style={[styles.filterChip, filterType === t && styles.filterChipActive]}>
            <Text style={[styles.filterText, filterType === t && styles.filterTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

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
              <MaterialCommunityIcons name="account-group" color={Colors.textMuted} size={48} />
              <Text style={styles.emptyText}>No teachers found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.tCard}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.display_name ?? 'T')[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.tName} numberOfLines={1}>{item.display_name ?? '—'}</Text>
                  <Text style={styles.tSub} numberOfLines={1}>{item.subtitle ?? item.subject ?? '—'}</Text>
                  {item.employee_code ? <Text style={styles.tCode}>Code: {item.employee_code}</Text> : null}
                  {item.email ? <Text style={styles.tCode}>{item.email}</Text> : null}
                  {item.date_of_joining ? <Text style={styles.tCode}>Joined: {item.date_of_joining}</Text> : null}
                </View>
                <View style={{ gap: 4, alignItems: 'flex-end' }}>
                  <Pill label={item.teacher_type ?? 'Regular'} tone={TYPE_COLORS[item.teacher_type as TeacherType] as any ?? 'success'} />
                  {item.class_teacher_of ? <Pill label={`CT ${item.class_teacher_of}`} tone="info" /> : null}
                </View>
              </View>
              <View style={styles.actionRow}>
                <Pressable onPress={() => openEdit(item)} style={styles.editBtn}>
                  <MaterialCommunityIcons name="pencil" color={Colors.info} size={14} />
                  <Text style={[styles.actionText, { color: Colors.info }]}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => removeTeacher(item)} style={styles.delBtn}>
                  <MaterialCommunityIcons name="delete-outline" color={Colors.danger} size={14} />
                  <Text style={[styles.actionText, { color: Colors.danger }]}>Remove</Text>
                </Pressable>
              </View>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
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
              <FField label="Full Name" value={displayName} onChange={setDisplayName} />
              <FField label="Employee Code" value={empCode} onChange={setEmpCode} keyboard="number-pad" />
              <FField label="Official Email" value={ownEmail} onChange={setOwnEmail} keyboard="email-address" placeholder="teacher@kvs.in" />
              <FField label="Phone" value={phone} onChange={setPhone} keyboard="phone-pad" />
              <FField label="Date of Joining (YYYY-MM-DD)" value={dateOfJoining} onChange={setDateOfJoining} />

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Teacher Type</Text>
              <View style={styles.chips}>
                {TEACHER_TYPES.map(t => (
                  <Pressable key={t} onPress={() => setTeacherType(t)}
                    style={[styles.chip, teacherType === t && styles.chipActive]}>
                    <Text style={[styles.chipText, teacherType === t && styles.chipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Designation</Text>
              <View style={styles.chips}>
                {DESIGNATIONS.map(d => (
                  <Pressable key={d} onPress={() => setDesignation(d)}
                    style={[styles.chip, designation === d && styles.chipActive]}>
                    <Text style={[styles.chipText, designation === d && styles.chipTextActive]}>{d}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Subject</Text>
              <View style={styles.chips}>
                {SUBJECTS.map(s => (
                  <Pressable key={s} onPress={() => setSubject(s)}
                    style={[styles.chip, subject === s && styles.chipActive]}>
                    <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Class Teacher Of</Text>
              <View style={styles.chips}>
                <Pressable onPress={() => setClassOf('')}
                  style={[styles.chip, classOf === '' && styles.chipActive]}>
                  <Text style={[styles.chipText, classOf === '' && styles.chipTextActive]}>None</Text>
                </Pressable>
                {SECTIONS.map(s => (
                  <Pressable key={s} onPress={() => setClassOf(s)}
                    style={[styles.chip, classOf === s && styles.chipActive]}>
                    <Text style={[styles.chipText, classOf === s && styles.chipTextActive]}>{s}</Text>
                  </Pressable>
                ))}
              </View>

              <PrimaryButton label={editTeacher ? 'Update' : 'Add Teacher'} onPress={submit} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function FField({ label, value, onChange, keyboard, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; keyboard?: any; placeholder?: string;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType={keyboard ?? 'default'}
        placeholder={placeholder ?? ''} placeholderTextColor={Colors.textMuted} autoCapitalize="none"
        style={{ marginTop: 6, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: Colors.textPrimary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  filterBar: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  tCard: { paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  tName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  tSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tCode: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.infoBg, borderRadius: Radius.sm },
  delBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.dangerBg, borderRadius: Radius.sm },
  actionText: { fontSize: 12, fontWeight: '700' },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted, marginTop: 12 },
  fab: { position: 'absolute', right: 24, bottom: 32, width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.raised },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  form: { padding: Spacing.xl, paddingBottom: 60 },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
});
