// Admin: Timetable Management — Manual entry + Excel-compatible CSV upload
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SECTIONS = ['10A', '10B', '10C', '10D', '11A', '11B', '12A', '12B'];
const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Economics', 'Work Education', 'Art Education', 'Physical Education'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const PERIOD_TIMES: Record<number, [string, string]> = {
  1: ['8:00', '8:45'], 2: ['8:45', '9:30'], 3: ['9:30', '10:15'],
  4: ['10:30', '11:15'], 5: ['11:15', '12:00'], 6: ['12:45', '1:30'],
  7: ['1:30', '2:15'], 8: ['2:15', '3:00'],
};

const SAMPLE_CSV = `section,day_of_week,period,subject,start_time,end_time
10C,Monday,1,English,8:00,8:45
10C,Monday,2,Mathematics,8:45,9:30
10C,Monday,3,Science,9:30,10:15
10C,Monday,4,Social Science,10:30,11:15
10C,Monday,5,Hindi,11:15,12:00
10C,Monday,6,Computer Science,12:45,1:30
10C,Tuesday,1,Mathematics,8:00,8:45
10C,Tuesday,2,Science,8:45,9:30
11A,Monday,1,Computer Science,8:00,8:45
11A,Monday,2,Physics,8:45,9:30
11A,Monday,3,Chemistry,9:30,10:15`;

export default function AdminTimetableManager() {
  const { showAlert } = useAlert();
  const [section, setSection] = useState('10C');
  const [day, setDay] = useState('Monday');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [uploading, setUploading] = useState(false);

  // Add form state
  const [period, setPeriod] = useState(1);
  const [subject, setSubject] = useState('Mathematics');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTimetable(); }, [section, day]);

  const loadTimetable = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('timetable')
      .select('*')
      .eq('section', section)
      .eq('day_of_week', day)
      .order('period');
    setTimetable(data ?? []);
    setLoading(false);
  };

  const addPeriod = async () => {
    const times = PERIOD_TIMES[period] ?? ['8:00', '8:45'];
    setSaving(true);
    const { error } = await supabase.from('timetable').upsert({
      section, day_of_week: day, period, subject,
      start_time: times[0], end_time: times[1],
    }, { onConflict: 'section,day_of_week,period' });
    setSaving(false);
    if (error) { showAlert('Error', error.message); return; }
    showAlert('Added', `Period ${period} · ${subject}`);
    setShowAddForm(false);
    loadTimetable();
  };

  const deletePeriod = async (id: string, periodNum: number) => {
    showAlert('Delete period?', `Remove Period ${periodNum}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('timetable').delete().eq('id', id);
        loadTimetable();
      }},
    ]);
  };

  const downloadSample = async () => {
    try {
      await Share.share({
        title: 'Timetable_Sample.csv',
        message: SAMPLE_CSV,
      });
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
      const vals = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      header.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });
      if (row.section && row.day_of_week && row.period && row.subject) {
        rows.push({
          section: row.section,
          day_of_week: row.day_of_week,
          period: parseInt(row.period),
          subject: row.subject,
          start_time: row.start_time || '8:00',
          end_time: row.end_time || '8:45',
        });
      }
    }
    if (rows.length === 0) { showAlert('Parse error', 'No valid rows found. Check your CSV format.'); setUploading(false); return; }
    const { error } = await supabase.from('timetable').upsert(rows, { onConflict: 'section,day_of_week,period' });
    setUploading(false);
    if (error) { showAlert('Upload failed', error.message); return; }
    showAlert('Uploaded', `${rows.length} timetable entries updated successfully.`);
    setShowBulkUpload(false);
    setCsvText('');
    loadTimetable();
  };

  const subjectColor = (sub: string): string => {
    const map: Record<string, string> = {
      'Mathematics': '#2A6FDB', 'Science': '#1FA971', 'English': '#E0414C',
      'Hindi': '#E8A317', 'Social Science': '#6E55C2', 'Physics': '#0891b2',
      'Chemistry': '#d97706', 'Computer Science': '#7c3aed',
    };
    return map[sub] ?? Colors.primary;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title="Timetable Manager" subtitle="Add periods or upload Excel CSV" />
      </SafeAreaView>

      {/* Section & Day filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.xl }}>
        {SECTIONS.map(s => (
          <Pressable key={s} onPress={() => setSection(s)} style={[styles.chip, section === s && styles.chipActive]}>
            <Text style={[styles.chipText, section === s && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ gap: 8, paddingHorizontal: Spacing.xl }}>
        {DAYS.map(d => (
          <Pressable key={d} onPress={() => setDay(d)} style={[styles.chip, day === d && styles.chipActive]}>
            <Text style={[styles.chipText, day === d && styles.chipTextActive]}>{d.slice(0, 3)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <Pressable onPress={downloadSample} style={styles.sampleBtn}>
          <MaterialCommunityIcons name="download" color={Colors.info} size={16} />
          <Text style={styles.sampleBtnText}>Download Sample</Text>
        </Pressable>
        <Pressable onPress={() => setShowBulkUpload(true)} style={styles.uploadBtn}>
          <MaterialCommunityIcons name="upload" color={Colors.success} size={16} />
          <Text style={styles.uploadBtnText}>Bulk Upload CSV</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={timetable}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.dayHeader}>{section} · {day} · {timetable.length} periods</Text>
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <MaterialCommunityIcons name="timetable" color={Colors.textMuted} size={48} />
              <Text style={{ color: Colors.textMuted, fontSize: 16, fontWeight: '600', marginTop: 12 }}>No periods for {day}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = subjectColor(item.subject);
            return (
              <Card style={[styles.periodCard, { borderLeftWidth: 4, borderLeftColor: color }]}>
                <View style={styles.row}>
                  <View style={[styles.periodBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[styles.periodNum, { color }]}>P{item.period}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.subjectName}>{item.subject}</Text>
                    <Text style={styles.timeText}>{item.start_time} – {item.end_time}</Text>
                  </View>
                  <Pressable onPress={() => deletePeriod(item.id, item.period)} style={styles.delBtn} hitSlop={8}>
                    <MaterialCommunityIcons name="delete-outline" color={Colors.danger} size={20} />
                  </Pressable>
                </View>
              </Card>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <Pressable onPress={() => setShowAddForm(true)} style={styles.fab}>
        <MaterialCommunityIcons name="plus" color="#fff" size={28} />
      </Pressable>

      {/* Add period modal */}
      <Modal visible={showAddForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddForm(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Period</Text>
            <Pressable onPress={() => setShowAddForm(false)} hitSlop={12}>
              <MaterialCommunityIcons name="close" color={Colors.textSecondary} size={24} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.formLabel}>Section: {section} · {day}</Text>

            <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Period Number</Text>
            <View style={styles.chips}>
              {PERIODS.map(p => (
                <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.chip, period === p && styles.chipActive]}>
                  <Text style={[styles.chipText, period === p && styles.chipTextActive]}>P{p}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>Time: {PERIOD_TIMES[period]?.[0]} – {PERIOD_TIMES[period]?.[1]}</Text>

            <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Subject</Text>
            <View style={styles.chips}>
              {SUBJECTS.map(s => (
                <Pressable key={s} onPress={() => setSubject(s)} style={[styles.chip, subject === s && styles.chipActive]}>
                  <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton label={saving ? 'Saving…' : 'Add Period'} onPress={addPeriod} loading={saving} size="lg" style={{ marginTop: Spacing.xl }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bulk upload modal */}
      <Modal visible={showBulkUpload} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBulkUpload(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Upload Timetable</Text>
              <Pressable onPress={() => setShowBulkUpload(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" color={Colors.textSecondary} size={24} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              <View style={styles.infoBanner}>
                <MaterialCommunityIcons name="information" color={Colors.info} size={16} />
                <Text style={styles.infoText}>
                  Open Excel, fill the timetable, save as CSV, then paste contents below. Required columns: section, day_of_week, period, subject, start_time, end_time
                </Text>
              </View>

              <Pressable onPress={downloadSample} style={styles.sampleBtn2}>
                <MaterialCommunityIcons name="download" color={Colors.info} size={16} />
                <Text style={styles.sampleBtnText}>Download Sample CSV Template</Text>
              </Pressable>

              <Text style={[styles.formLabel, { marginTop: Spacing.xl }]}>Paste CSV Content</Text>
              <TextInput
                value={csvText}
                onChangeText={setCsvText}
                placeholder={`section,day_of_week,period,subject,start_time,end_time\n10C,Monday,1,English,8:00,8:45\n...`}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={10}
                style={styles.csvInput}
              />

              <PrimaryButton label={uploading ? 'Uploading…' : 'Upload Timetable'} onPress={parseCsvAndUpload} loading={uploading} size="lg" style={{ marginTop: Spacing.xl }} />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { paddingVertical: Spacing.sm },
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: Spacing.xl, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  sampleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: Colors.infoBg, borderRadius: Radius.md },
  sampleBtnText: { color: Colors.info, fontSize: 13, fontWeight: '700' },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: Colors.successBg, borderRadius: Radius.md },
  uploadBtnText: { color: Colors.success, fontSize: 13, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  dayHeader: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  periodCard: {},
  row: { flexDirection: 'row', alignItems: 'center' },
  periodBadge: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  periodNum: { fontSize: 16, fontWeight: '900' },
  subjectName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  timeText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  delBtn: { padding: 6 },
  fab: { position: 'absolute', right: 24, bottom: 32, width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.raised },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  form: { padding: Spacing.xl, paddingBottom: 60 },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.infoBg, borderRadius: Radius.md, padding: 12, marginBottom: Spacing.lg },
  infoText: { flex: 1, fontSize: 13, color: Colors.info, fontWeight: '500', lineHeight: 20 },
  sampleBtn2: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: Colors.infoBg, borderRadius: Radius.md },
  csvInput: { backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, padding: 14, fontSize: 13, color: Colors.textPrimary, minHeight: 200, borderWidth: 1, borderColor: Colors.border, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
