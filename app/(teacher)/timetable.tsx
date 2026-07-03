// Teacher: Timetable Viewer — day-wise period schedule
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { fetchTimetable } from '@/services/schoolData';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const todayName = (): string => {
  const d = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return d[new Date().getDay()] ?? 'Monday';
};

const subjectColor = (sub: string): string => {
  const map: Record<string, string> = {
    'Mathematics': '#2A6FDB', 'Science': '#1FA971', 'English': '#E0414C',
    'Hindi': '#E8A317', 'Social Science': '#6E55C2', 'Physics': '#0891b2',
    'Chemistry': '#d97706', 'Biology': '#059669', 'Computer Science': '#7c3aed',
    'Economics': '#db2777', 'Work Education': '#78350f', 'Art Education': '#92400e',
  };
  return map[sub] ?? Colors.primary;
};

export default function TeacherTimetable() {
  const { user } = useAuth();
  const section = user?.classTeacherOf ?? user?.section ?? '10A';

  const [selectedDay, setSelectedDay] = useState(todayName() === 'Sunday' ? 'Monday' : todayName());
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTimetable(); }, [selectedDay, section]);

  const loadTimetable = async () => {
    setLoading(true);
    const data = await fetchTimetable(section, selectedDay);
    setTimetable(data);
    setLoading(false);
  };

  const today = todayName();
  const isToday = selectedDay === today || (today === 'Sunday' && selectedDay === 'Monday');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title="Timetable" subtitle={`Class ${section} · ${selectedDay}`} />
      </SafeAreaView>

      {/* Day selector */}
      <View style={styles.dayBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayBarContent}>
          {DAYS.map(day => (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[styles.dayChip, selectedDay === day && styles.dayChipActive, day === today && styles.todayChip]}
            >
              <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextActive]}>
                {day.slice(0, 3)}
                {day === today ? ' •' : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={timetable}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            isToday ? (
              <View style={styles.todayBanner}>
                <MaterialCommunityIcons name="calendar-today" color={Colors.primary} size={16} />
                <Text style={styles.todayBannerText}>Today's schedule — {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="calendar-blank" color={Colors.textMuted} size={48} />
              <Text style={styles.emptyText}>No timetable for {selectedDay}</Text>
              <Text style={styles.emptySubText}>Ask admin to add periods for this day</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = subjectColor(item.subject);
            return (
              <Card style={[styles.periodCard, { borderLeftWidth: 4, borderLeftColor: color }]}>
                <View style={styles.row}>
                  <View style={[styles.periodBadge, { backgroundColor: color + '18' }]}>
                    <Text style={[styles.periodNum, { color }]}>P{item.period}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.subjectName}>{item.subject}</Text>
                    <Text style={styles.timeText}>{item.start_time} – {item.end_time}</Text>
                  </View>
                  <Pill label={item.section} tone="info" />
                </View>
              </Card>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dayBar: { paddingVertical: Spacing.sm },
  dayBarContent: { gap: 8, paddingHorizontal: Spacing.xl },
  dayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.pill, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  todayChip: { borderColor: Colors.primary },
  dayChipText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  dayChipTextActive: { color: '#fff' },
  list: { padding: Spacing.xl, paddingBottom: 40 },
  todayBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceTint, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  todayBannerText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  emptySubText: { fontSize: 13, color: Colors.textMuted },
  periodCard: {},
  row: { flexDirection: 'row', alignItems: 'center' },
  periodBadge: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  periodNum: { fontSize: 16, fontWeight: '900' },
  subjectName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  timeText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
});
