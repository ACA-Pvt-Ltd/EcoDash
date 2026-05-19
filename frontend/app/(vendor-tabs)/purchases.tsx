import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/services/api';
import { ENDPOINTS, COLORS } from '@/constants/config';

interface Purchase {
  _id: string;
  collector: { _id: string; name: string; phone?: string } | null;
  offer?: { _id: string; wasteType: string } | null;
  wasteType: string;
  quantity: { value: number; unit: string } | number;
  pricePerUnit: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending:   { bg: '#FFF3CD', text: '#856404', label: 'Pending',   icon: 'time-outline' },
  accepted:  { bg: '#D1E7DD', text: '#0A3622', label: 'Accepted',  icon: 'checkmark-circle-outline' },
  rejected:  { bg: '#F8D7DA', text: '#58151C', label: 'Rejected',  icon: 'close-circle-outline' },
  completed: { bg: '#CFF4FC', text: '#055160', label: 'Completed', icon: 'checkmark-done-circle-outline' },
  cancelled: { bg: '#E2E3E5', text: '#41464B', label: 'Cancelled', icon: 'ban-outline' },
};

const TABS = ['all', 'pending', 'accepted', 'completed', 'rejected'] as const;
type Tab = typeof TABS[number];

function getQty(q: Purchase['quantity']) {
  return typeof q === 'object' ? `${q.value} ${q.unit}` : `${q} kg`;
}

export default function VendorPurchasesScreen() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const fetchPurchases = async () => {
    try {
      const res: any = await api.get(ENDPOINTS.VENDOR_PURCHASES);
      if (res.success) {
        setPurchases(res.data || []);
      }
    } catch {
      setPurchases([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPurchases(); }, []));

  const handleCancel = (purchaseId: string) => {
    Alert.alert('Cancel Purchase', 'Are you sure you want to cancel this purchase request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Request',
        style: 'destructive',
        onPress: async () => {
          try {
            const res: any = await api.put(ENDPOINTS.VENDOR_CANCEL_PURCHASE(purchaseId));
            if (res.success) {
              Alert.alert('Cancelled', 'Purchase request has been cancelled.');
              fetchPurchases();
            } else {
              Alert.alert('Error', res.message || 'Failed to cancel');
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  const handleChat = (purchase: Purchase) => {
    const collectorName = purchase.collector?.name || 'Collector';
    const collectorId = purchase.collector?._id;
    if (!collectorId) return;
    router.push({
      pathname: '/(vendor-tabs)/chat',
      params: { purchaseId: purchase._id, collectorName, collectorId },
    } as any);
  };

  const filtered = activeTab === 'all'
    ? purchases
    : purchases.filter(p => p.status === activeTab);

  const renderItem = ({ item }: { item: Purchase }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const collectorName = item.collector?.name || 'Unknown Collector';

    return (
      <View style={styles.card}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{collectorName[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.collectorName}>{collectorName}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={12} color={cfg.text} />
            <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        {/* Waste info */}
        <Text style={styles.wasteType}>{item.wasteType}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Qty</Text>
            <Text style={styles.metaValue}>{getQty(item.quantity)}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Price/kg</Text>
            <Text style={styles.metaValue}>LKR {item.pricePerUnit}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total</Text>
            <Text style={[styles.metaValue, { color: COLORS.primary }]}>LKR {item.totalAmount}</Text>
          </View>
        </View>

        {item.notes ? <Text style={styles.notes}>"{item.notes}"</Text> : null}

        {/* Actions */}
        <View style={styles.actions}>
          {(item.status === 'pending' || item.status === 'accepted') && (
            <TouchableOpacity style={styles.chatBtn} onPress={() => handleChat(item)}>
              <Ionicons name="chatbubble-outline" size={15} color={COLORS.primary} />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          )}
          {item.status === 'pending' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item._id)}>
              <Ionicons name="close-circle-outline" size={15} color="#E74C3C" />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.push('/(vendor-tabs)/' as any)}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Purchases</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p._id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPurchases(); }} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
              <Text style={styles.emptyTitle}>No purchases yet</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'all' ? 'Browse offers and make your first purchase' : `No ${activeTab} purchases`}
              </Text>
              {activeTab === 'all' && (
                <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(vendor-tabs)/offers' as any)}>
                  <Text style={styles.browseBtnText}>Browse Offers</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10,
    gap: 6, backgroundColor: '#F5F6FA', borderBottomWidth: 1, borderBottomColor: '#E8E8E8',
  },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0' },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: '#7F8C8D' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#E8E8E8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  collectorName: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  date: { fontSize: 11, color: '#95A5A6', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  wasteType: { fontSize: 15, fontWeight: '700', color: '#2C3E50', marginBottom: 10 },
  metaRow: { flexDirection: 'row', backgroundColor: '#F5F6FA', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  metaItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  metaLabel: { fontSize: 10, color: '#95A5A6', marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '700', color: '#2C3E50' },
  metaDivider: { width: 1, backgroundColor: '#E8E8E8', alignSelf: 'stretch' },
  notes: { fontSize: 13, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  chatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8, paddingVertical: 9,
  },
  chatBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#E74C3C', borderRadius: 8, paddingVertical: 9,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#E74C3C' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#7F8C8D', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  browseBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
