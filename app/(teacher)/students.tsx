// Teacher: Student Management — Add, Delete, Bulk Upload via CSV
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAlert } from '@/template';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { getSupabaseClient } from '@/template';
import { useAuth } from '@/hooks/useAuth';

const supabase = getSupabaseClient();

// Sample student CSV template
const SAMPLE_CSV = `name,admission_no,section,parent_phone,dob,address,parent_name,blood_group,attendance_pct
ARCHANA S,271808221006008,10C,+91 9876543210,2009-01-15,Sector 4 DLF,Rajesh S,A+,88
ESHITA K S,271808221006126,10C,+91 9876543211,2009-03-22,Sector 8,Kishore K,B+,91
MAHESWARAN RANJITH,271808222006451,10C,+91 9876543212,2009-05-10,Sector 12,Ranjith M,O+,85`;

interface Student {
  id: string; name: string; admission_no: string;
  section: string; attendance_pct: number;
}

export default function TeacherStudentManagement() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const section = user?.classTeacherOf ?? user?.section ?? '10A';

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Add form
  const [name, setName] = useState('');
  const [admNo, setAdmNo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('id, name, admission_no, section, attendance_pct')
      .eq('section', section)
      .order('name');
    setStudents((data as Student[]) ?? []);
    setLoading(false);
  };

  const addStudent = async () => {
    if (!name.trim() || !admNo.trim()) { showAlert('Missing fields', 'Enter name and admission number.'); return; }
    setSaving(true);
    const { error } = await supabase.from('students').insert({
      name: name.trim(), admission_no: admNo.trim(), section, attendance_pct: 90,
    });
    setSaving(false);
    if (error) { showAlert('Error', error.message); return; }
    showAlert('Added', `${name} added to ${section}`);
    setShowAddForm(false);
    setName(''); setAdmNo('');
    loadStudents();
  };

  const deleteStudent = (s: Student) => {
    showAlert(
      'Remove student?',
      `Remove ${s.name} from ${section}? This only removes them from this class.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            await supabase.from('students').delete().eq('id', s.id);
            loadStudents();
            showAlert('Removed', `${s.name} removed from ${section}`);
          },
        },
      ]
    );
  };

  const downloadSample = async () => {
    try {
      await Share.share({ title: 'Student_Template.csv', message: SAMPLE_CSV });
    } catch {
      showAlert('Error', 'Could not share sample file.');
    }
  };

  const parseCsvAndUpload = async () => {
    if (!csvText.trim()) { showAlert('Empty', 'Paste CSV content first.'); return; }
    setUploading(true);
    const lines = csvText.trim().split('\n').filter(l => l.trim());
    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      header.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });
      if (row.name && row.admission_no) {
        rows.push({
          name: row.name,
          admission_no: row.admission_no,
          section: row.section || section,
          attendance_pct: parseInt(row.attendance_pct || '90') || 90,
        });
      }
    }
    if (rows.length === 0) { showAlert('Parse error', 'No valid rows found.'); setUploading(false); return; }
    const { error } = await supabase.from('students').upsert(rows, { onConflict: 'admission_no' });
    setUploading(false);
    if (error) { showAlert('Upload failed', error.message); return; }
    showAlert('Uploaded', `${rows.length} students updated successfully.`);
    setShowBulkUpload(false);
    setCsvText('');
    loadStudents();
  };

  const filtered = students.filter(s =>
    !search.trim() ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title={`Class ${section} Students`} subtitle={`${students.length} enrolled`} />
      </SafeAreaView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Pressable onPress={downloadSample} style={styles.sampleBtn}>
          <MaterialCommunityIcons name="download" color={Colors.info} size={15} />
          <Text style={styles.sampleBtnText}>Sample CSV</Text>
        </Pressable>
        <Pressable onPress={() => setShowBulkUpload(true)} style={styles.uploadBtn}>
          <MaterialCommunityIcons name="upload" color={Colors.success} size={15} />
          <Text style={styles.uploadBtnText}>Bulk Upload</Text>
        </Pressable>
        <Pressable onPress={() => setShowAddForm(true)} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus" color="#fff" size={15} />
          <Text style={styles.addBtnText}>Add Student</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" color={Colors.textMuted} size={18} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search student…"
          placeholderTextColor={Colors.textMuted} style={styles.searchInput} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={s => s.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <MaterialCommunityIcons name="account-group" color={Colors.textMuted} size={48} />
              <Text style={{ color: Colors.textMuted, fontSize: 16, fontWeight: '600', marginTop: 12 }}>No students</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Card style={styles.studentCard}>
              <View style={styles.row}>
                <View style={styles.rollNo}>
                  <Text style={styles.rollNoText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.studentMeta}>{item.admission_no} · Att: {item.attendance_pct}%</Text>
                </View>
                <Pill label={item.section} tone="info" />
                <Pressable onPress={() => deleteStudent(item)} style={styles.delBtn} hitSlop={8}>
                  <MaterialCommunityIcons name="delete-outline" color={Colors.danger} size={18} />
                </Pressable>
              </View>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      )}

      {/* Add student modal */}
      <Modal visible={showAddForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Student to {section}</Text>
              <Pressable onPress={() => setShowAddForm(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" color={Colors.textSecondary} size={24} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Student full name" placeholderTextColor={Colors.textMuted} style={styles.formInput} />
              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Admission Number</Text>
              <TextInput value={admNo} onChangeText={setAdmNo} placeholder="e.g. 271808221006008" placeholderTextColor={Colors.textMuted} style={styles.formInput} />
              <PrimaryButton label={saving ? 'Adding…' : 'Add Student'} onPress={addStudent} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bulk upload modal */}
      <Modal visible={showBulkUpload} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBulkUpload(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Student Upload</Text>
              <Pressable onPress={() => setShowBulkUpload(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" color={Colors.textSecondary} size={24} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              <View style={styles.infoBanner}>
                <MaterialCommunityIcons name="microsoft-excel" color={Colors.success} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoTitle}>Excel Upload Guide</Text>
                  <Text style={styles.infoText}>
                    1. Download sample CSV template{"\n"}
                    2. Open in Excel and fill all student details{"\n"}
                    3. Save as CSV (Comma delimited){"\n"}
                    4. Open the file, select all (Ctrl+A), copy and paste below{"\n"}
                    Required: name, admission_no (optional: section, attendance_pct)
                  </Text>
                </View>
              </View>

              <Pressable onPress={downloadSample} style={styles.sampleBtn2}>
                <MaterialCommunityIcons name="download" color={Colors.info} size={16} />
                <Text style={styles.sampleBtnText}>Download Sample Excel Template</Text>
              </Pressable>

              <Text style={[styles.formLabel, { marginTop: Spacing.xl }]}>Paste CSV Content Here</Text>
              <TextInput
                value={csvText}
                onChangeText={setCsvText}
                placeholder={`name,admission_no,section\nARCHANA S,271808221006008,10C\n...`}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={12}
                style={styles.csvInput}
              />
              <Text style={styles.hint}>{csvText.split('\n').length - 1} rows detected</Text>

              <PrimaryButton label={uploading ? 'Uploading…' : 'Upload Students'} onPress={parseCsvAndUpload} loading={uploading} size="lg" style={{ marginTop: Spacing.xl }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: { flexDirection: 'row', gap: 8, marginHorizontal: Spacing.xl, marginTop: Spacing.md, marginBottom: Spacing.sm },
  sampleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, backgroundColor: Colors.infoBg, borderRadius: Radius.md },
  sampleBtnText: { color: Colors.info, fontSize: 12, fontWeight: '700' },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, backgroundColor: Colors.successBg, borderRadius: Radius.md },
  uploadBtnText: { color: Colors.success, fontSize: 12, fontWeight: '700' },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 9, backgroundColor: Colors.primary, borderRadius: Radius.md },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, backgroundColor: '#fff', borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  studentCard: { paddingVertical: 10, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rollNo: { width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  rollNoText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  studentName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  studentMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  delBtn: { padding: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  form: { padding: Spacing.xl, paddingBottom: 60 },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  formInput: { marginTop: 8, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.successBg, borderRadius: Radius.md, padding: 12, marginBottom: Spacing.lg },
  infoTitle: { fontSize: 14, fontWeight: '800', color: Colors.success, marginBottom: 4 },
  infoText: { fontSize: 12, color: Colors.success, lineHeight: 20 },
  sampleBtn2: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: Colors.infoBg, borderRadius: Radius.md },
  csvInput: { backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, padding: 14, fontSize: 12, color: Colors.textPrimary, minHeight: 200, borderWidth: 1, borderColor: Colors.border, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginTop: 8 },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
