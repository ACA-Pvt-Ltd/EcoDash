import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS,  COLORS } from '@/constants/config';
import { router } from 'expo-router';
import { useAppConfig } from '@/context/AppConfigContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface UserWasteOffer {
  _id: string;
  wasteType: string;
  quantity: { value: number; unit: string };
  description?: string;
  expectedPrice: number;
  location: { address: string; city: string };
  status: 'available' | 'pending' | 'sold' | 'cancelled';
  availableFrom: string;
  availableUntil?: string;
  pickupPreference?: string;
  images?: string[];
  video?: string;
  createdAt: string;
  purchaseRequests?: any[];
}

const STATUS_COLOR: Record<string, string> = {
  available: '#2ECC71',
  pending: '#F39C12',
  sold: '#3498DB',
  cancelled: '#E74C3C',
};

const STATUS_SORT: Record<string, number> = {
  available: 0,
  pending: 1,
  sold: 2,
  cancelled: 3,
};

const FILTER_TABS = ['all', 'available', 'pending', 'sold'] as const;

export default function OffersScreen() {
  const { wasteCategories } = useAppConfig();
  const { token } = useAuth();
  const [offers, setOffers] = useState<UserWasteOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<typeof FILTER_TABS[number]>('all');

  const fetchOffers = useCallback(async () => {
    try {
      const url = filter === 'all'
        ? `${API_URL}${ENDPOINTS.USER_OFFERS}`
        : `${API_URL}${ENDPOINTS.USER_OFFERS}?status=${filter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setOffers(data.data || []);
      else Alert.alert('Error', data.message || 'Failed to fetch offers');
    } catch {
      Alert.alert('Error', 'Failed to load offers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, token]);

  useFocusEffect(
    useCallback(() => { fetchOffers(); }, [fetchOffers])
  );

  const deleteOffer = (offerId: string) => {
    Alert.alert('Delete Offer', 'Are you sure you want to delete this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}${ENDPOINTS.USER_DELETE_OFFER(offerId)}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) { Alert.alert('Success', 'Offer deleted'); fetchOffers(); }
            else Alert.alert('Error', data.message || 'Failed to delete offer');
          } catch {
            Alert.alert('Error', 'Failed to delete offer');
          }
        },
      },
    ]);
  };

  const getWasteType = (wt: string) => wasteCategories.find(t => t.value === wt);

  const renderCard = useCallback(({ item: offer }: { item: UserWasteOffer }) => {
    const wt = getWasteType(offer.wasteType);
    const hasImage = offer.images && offer.images.length > 0;
    const statusColor = STATUS_COLOR[offer.status] || '#95A5A6';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/(tabs)/offer-details?id=${offer._id}`)}
      >
        {/* Image area */}
        <View style={styles.imageBox}>
          {hasImage ? (
            <>
              <Image source={{ uri: offer.images![0] }} style={styles.cardImage} />
              {offer.video && (
                <View style={styles.playBadge}>
                  <Ionicons name="play-circle" size={28} color="#fff" />
                </View>
              )}
            </>
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: (wt?.color || '#95A5A6') + '20' }]}>
              <Text style={styles.placeholderEmoji}>{wt?.icon || '♻️'}</Text>
            </View>
          )}
          {/* Status pill */}
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text style={styles.statusPillText}>{offer.status}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{offer.wasteType}</Text>
          <Text style={styles.cardPrice}>LKR {offer.expectedPrice}</Text>
          <Text style={styles.cardQty}>{offer.quantity.value} {offer.quantity.unit}</Text>
          <View style={styles.cardLocation}>
            <Ionicons name="location-outline" size={11} color="#95A5A6" />
            <Text style={styles.cardLocationText} numberOfLines={1}>{offer.location.city}</Text>
          </View>
        </View>

        {/* Delete shortcut for available */}
        {offer.status === 'available' && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteOffer(offer._id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={15} color="#E74C3C" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }, [offers]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Offers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/create-offer')}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Sell</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="file-tray-outline" size={72} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Offers Yet</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' ? 'Create your first offer to start selling.' : `No ${filter} offers.`}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/create-offer')}>
              <Text style={styles.emptyBtnText}>Create Offer</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={[...offers].sort((a, b) => (STATUS_SORT[a.status] ?? 9) - (STATUS_SORT[b.status] ?? 9))}
          keyExtractor={o => o._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOffers(); }}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, color: '#95A5A6', fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },
  listContent: { padding: 16, backgroundColor: '#F5F6FA' },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageBox: { width: '100%', height: 130, position: 'relative' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: { fontSize: 44 },
  playBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 16,
    padding: 2,
  },
  statusPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: { fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  cardBody: { padding: 10, paddingBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 3 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  cardQty: { fontSize: 11, color: '#7F8C8D', marginBottom: 4 },
  cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLocationText: { fontSize: 11, color: '#95A5A6', flex: 1 },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#7F8C8D', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
