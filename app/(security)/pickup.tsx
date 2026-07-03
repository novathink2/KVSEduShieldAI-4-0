// Security Guard: Early Pickup Request Management
// Powered by OnSpace.AI

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { fetchPickupRequests, updatePickupStatus } from '@/services/schoolData';

export default function SecurityPickup() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Approved' | 'Completed'>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await fetchPickupRequests();
    setPickups(data);
    setLoading(false);
  };

  const approve = async (id: string, studentName: string) => {
    await updatePickupStatus(id, 'Approved');
    setPickups(prev => prev.map(p => p.id === id ? { ...p, status: 'Approved' } : p));
    showAlert('Approved', `${studentName} pickup approved. Inform the teacher.`);
  };

  const deny = async (id: string, studentName: string) => {
    await updatePickupStatus(id, 'Denied');
    setPickups(prev => prev.map(p => p.id === id ? { ...p, status: 'Denied' } : p));
    showAlert('Denied', `${studentName} pickup request denied.`);
  };

  const complete = async (id: string, studentName: string) => {
    await updatePickupStatus(id, 'Completed');
    setPickups(prev => prev.map(p => p.id === id ? { ...p, status: 'Completed' } : p));
    showAlert('Completed', `${studentName} has been safely picked up.`);
  };

  const statusColor = (s: string) => {
    if (s === 'Pending') return 'warning';
    if (s === 'Approved') return 'info';
    if (s === 'Completed') return 'success';
    return 'neutral';
  };

  const filtered = filter === 'all' ? pickups : pickups.filter(p => p.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView edges={['top']}>
        <ScreenHeader title="Early Pickups" subtitle={`${pickups.filter(p => p.status === 'Pending').length} pending`} />
      </SafeAreaView>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'Pending', 'Approved', 'Completed'] as const).map(f => (
          <Pressable key={f} onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#EF4444" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <MaterialCommunityIcons name="car-check" color={Colors.success} size={56} />
              <Text style={{ color: Colors.textMuted, fontWeight: '600', marginTop: 12, fontSize: 16 }}>No pickup requests</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.students?.name ?? 'S')[0]}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.studentName}>{item.students?.name ?? 'Unknown'}</Text>
                  <Text style={styles.meta}>Section: {item.students?.section} · Time: {item.pickup_time}</Text>
                </View>
                <Pill label={item.status} tone={statusColor(item.status)} />
              </View>
              <View style={styles.detailBox}>
                <DetailRow icon="account" label="Authorized Person" value={item.authorized_person ?? 'Parent/Guardian'} />
                <DetailRow icon="information" label="Reason" value={item.reason} />
                <DetailRow icon="clock" label="Created" value={new Date(item.created_at).toLocaleString('en-IN')} />
              </View>
              {item.status === 'Pending' && (
                <View style={styles.actionRow}>
                  <Pressable onPress={() => approve(item.id, item.students?.name)} style={styles.approveBtn}>
                    <MaterialCommunityIcons name="check" color="#fff" size={16} />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </Pressable>
                  <Pressable onPress={() => deny(item.id, item.students?.name)} style={styles.denyBtn}>
                    <MaterialCommunityIcons name="close" color={Colors.danger} size={16} />
                    <Text style={styles.denyBtnText}>Deny</Text>
                  </Pressable>
                </View>
              )}
              {item.status === 'Approved' && (
                <Pressable onPress={() => complete(item.id, item.students?.name)} style={styles.completeBtn}>
                  <MaterialCommunityIcons name="gate-open" color="#fff" size={16} />
                  <Text style={styles.completeBtnText}>Mark as Released</Text>
                </Pressable>
              )}
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 }}>
      <MaterialCommunityIcons name={icon as any} color={Colors.textMuted} size={16} />
      <Text style={{ fontSize: 12, color: Colors.textMuted, fontWeight: '600', width: 120 }}>{label}:</Text>
      <Text style={{ flex: 1, fontSize: 12, color: Colors.textPrimary, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: 8, padding: Spacing.lg, paddingTop: Spacing.sm },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.pill, backgroundColor: Colors.surfaceMuted, borderWidth: 1.5, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  card: { padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  studentName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  detailBox: { backgroundColor: Colors.surfaceMuted, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: Colors.success, borderRadius: Radius.md },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  denyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: Colors.dangerBg, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.danger },
  denyBtnText: { color: Colors.danger, fontSize: 13, fontWeight: '800' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, backgroundColor: Colors.info, borderRadius: Radius.md, marginTop: Spacing.md },
  completeBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
