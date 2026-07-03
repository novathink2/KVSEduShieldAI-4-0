// Parent: Unified Safety + Academic Feed (Hero)
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedItemCard } from '@/components/feed/FeedItem';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { parentFeed } from '@/services/mockData';

export default function ParentFeed() {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.primaryDark }}>
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary, '#2A6FDB']}
          style={styles.heroWrap}
        >
          <View style={styles.row}>
            <View>
              <Text style={styles.hello}>Good afternoon</Text>
              <Text style={styles.name}>{user?.name ?? 'Parent'}</Text>
            </View>
            <View style={styles.bellBadge}>
              <MaterialCommunityIcons name="bell" color="#fff" size={20} />
              <View style={styles.dot} />
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusIcon}>
                <MaterialCommunityIcons name="home-heart" size={22} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>{user?.studentName ?? 'STUDENT'} · CLASS {user?.section ?? '—'}</Text>
                <Text style={styles.statusValue}>Home · Safe</Text>
              </View>
              <View style={styles.livePill}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            {user?.admissionNo && (
              <View style={styles.admRow}>
                <MaterialCommunityIcons name="card-account-details-outline" color={Colors.textMuted} size={14} />
                <Text style={styles.admText}>Adm No: {user.admissionNo}</Text>
              </View>
            )}

            <View style={styles.miniGrid}>
              <MiniStat icon="check-circle" label="Attendance" value="94%" tone={Colors.success} />
              <View style={styles.divider} />
              <MiniStat icon="clipboard-text" label="Homework" value="3 due" tone={Colors.warning} />
              <View style={styles.divider} />
              <MiniStat icon="bus" label="Bus 3" value="On time" tone={Colors.info} />
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <FlatList
        data={parentFeed}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <FeedItemCard item={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Today's timeline</Text>
            <Pressable hitSlop={8}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function MiniStat({ icon, label, value, tone }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string; tone: string }) {
  return (
    <View style={styles.mini}>
      <MaterialCommunityIcons name={icon} color={tone} size={18} />
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hello: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  bellBadge: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  dot: { position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.saffron, borderWidth: 2, borderColor: Colors.primaryDark },
  statusCard: {
    marginTop: Spacing.xl,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.raised,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.successBg, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 0.7 },
  statusValue: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.successBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { color: Colors.success, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  admRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  admText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  miniGrid: { flexDirection: 'row', marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  mini: { flex: 1, alignItems: 'center' },
  miniValue: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  miniLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  divider: { width: 1, backgroundColor: Colors.border, marginVertical: 6 },
  list: { paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  viewAll: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
});
