// Teacher: Lesson Tracker — record subject/chapter/topic with real DB
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
import { useAuth } from '@/hooks/useAuth';
import { fetchLessons, saveLesson } from '@/services/schoolData';

const ALL_SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Economics', 'Work Education', 'Art Education'];

export default function TeacherLesson() {
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const section = user?.classTeacherOf ?? user?.section ?? '10A';
  const mySubject = user?.subject ?? ALL_SUBJECTS[0];

  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [subject, setSubject] = useState(mySubject);
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadLessons(); }, [section]);

  const loadLessons = async () => {
    setLoading(true);
    const data = await fetchLessons(section, 30);
    setLessons(data);
    setLoading(false);
  };

  const copyPrevious = () => {
    if (lessons.length === 0) { showAlert('No previous lesson', 'Add your first lesson manually.'); return; }
    const prev = lessons[0];
    setSubject(prev.subject);
    setChapter(prev.chapter);
    setTopic(prev.topic);
    setShowForm(true);
    showAlert('Copied', 'Previous lesson details copied. Edit as needed.');
  };

  const submit = async () => {
    if (!chapter.trim() || !topic.trim()) {
      showAlert('Missing fields', 'Enter chapter and topic.');
      return;
    }
    setSaving(true);
    const { error } = await saveLesson({
      subject, chapter: chapter.trim(), topic: topic.trim(),
      section, lesson_date: date, taught_by: user?.id,
    });
    setSaving(false);
    if (error) { showAlert('Error', error); return; }
    showAlert('Lesson saved', `${subject} · ${topic}`);
    setChapter(''); setTopic('');
    setShowForm(false);
    loadLessons();
  };

  const subjectColor = (sub: string) => {
    const map: Record<string, string> = {
      'Mathematics': '#2A6FDB', 'Science': '#1FA971', 'English': '#E0414C',
      'Hindi': '#E8A317', 'Social Science': '#6E55C2', 'Physics': '#0891b2',
      'Chemistry': '#d97706', 'Biology': '#059669', 'Computer Science': '#7c3aed',
    };
    return map[sub] ?? Colors.primary;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title="Lesson Tracker" subtitle={`Class ${section} · ${mySubject}`} />
      </SafeAreaView>

      {/* Quick actions */}
      <View style={styles.actionRow}>
        <Pressable onPress={() => setShowForm(true)} style={styles.addBtn}>
          <MaterialCommunityIcons name="plus-circle" color={Colors.primary} size={20} />
          <Text style={styles.addBtnText}>Record Lesson</Text>
        </Pressable>
        <Pressable onPress={copyPrevious} style={styles.copyBtn}>
          <MaterialCommunityIcons name="content-copy" color={Colors.info} size={18} />
          <Text style={styles.copyBtnText}>Copy Previous</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="book-open-variant" color={Colors.textMuted} size={48} />
              <Text style={styles.emptyText}>No lessons recorded yet</Text>
              <Text style={styles.emptySubText}>Tap "Record Lesson" to add one</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.lessonCard}>
              <View style={styles.lessonRow}>
                <View style={[styles.subjectBadge, { backgroundColor: subjectColor(item.subject) + '20' }]}>
                  <Text style={[styles.subjectBadgeText, { color: subjectColor(item.subject) }]}>
                    {item.subject.slice(0, 3).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.topicTitle}>{item.topic}</Text>
                  <Text style={styles.chapterText}>{item.chapter} · {item.subject}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.dateText}>{item.lesson_date}</Text>
                  <Pill label={item.section} tone="info" />
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* Add Lesson Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Lesson</Text>
              <Pressable onPress={() => setShowForm(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" color={Colors.textSecondary} size={24} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Subject</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {ALL_SUBJECTS.map(s => (
                    <Pressable key={s} onPress={() => setSubject(s)} style={[styles.chip, subject === s && styles.chipActive]}>
                      <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={[styles.formLabel, { marginTop: Spacing.xl }]}>Chapter</Text>
              <TextInput
                value={chapter} onChangeText={setChapter}
                placeholder="e.g. Triangles" placeholderTextColor={Colors.textMuted}
                style={styles.formInput}
              />

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Topic covered</Text>
              <TextInput
                value={topic} onChangeText={setTopic}
                placeholder="e.g. Similarity Theorem" placeholderTextColor={Colors.textMuted}
                style={styles.formInput}
              />

              <Text style={[styles.formLabel, { marginTop: Spacing.lg }]}>Date (YYYY-MM-DD)</Text>
              <TextInput
                value={date} onChangeText={setDate}
                placeholder={new Date().toISOString().split('T')[0]}
                placeholderTextColor={Colors.textMuted}
                style={styles.formInput}
              />

              <PrimaryButton
                label="Save Lesson"
                onPress={submit}
                loading={saving}
                size="lg"
                style={{ marginTop: Spacing.xl }}
              />
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: Colors.surfaceTint, borderRadius: Radius.md },
  addBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '800' },
  copyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: Colors.infoBg, borderRadius: Radius.md },
  copyBtnText: { color: Colors.info, fontSize: 14, fontWeight: '800' },
  list: { padding: Spacing.xl, paddingBottom: 40 },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  emptySubText: { fontSize: 13, color: Colors.textMuted },
  lessonCard: { marginBottom: Spacing.md },
  lessonRow: { flexDirection: 'row', alignItems: 'center' },
  subjectBadge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  subjectBadgeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  topicTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  chapterText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  dateText: { fontSize: 11, color: Colors.textMuted, fontWeight: '700', marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  form: { padding: Spacing.xl, paddingBottom: 60 },
  formLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.3, textTransform: 'uppercase' },
  formInput: { marginTop: 8, backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: '#fff' },
});
