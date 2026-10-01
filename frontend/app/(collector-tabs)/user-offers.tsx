import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS,  COLORS } from '@/constants/config';
import { router } from 'expo-router';
import { useAppConfig } from '@/context/AppConfigContext';
import OfferFilters, { FilterCountBadge } from '@/components/OfferFilters';
import {
  EMPTY_OFFER_FILTERS,
  activeFilterCount,
  filterOffers,
  type OfferFilterState,
  type OfferGetters,
} from '@/utils/offerFilters';
import { useTranslation } from '@/context/LanguageContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface UserWasteOffer {
  _id: string;
  user: { _id: string; name: string; email: string; phone: string; address?: { city?: string; state?: string } };
  wasteType: string;
  quantity: { value: number; unit: string };
  description?: string;
  expectedPrice: number;
  location: { address: string; city: string };
  status: string;
  availableFrom: string;
  availableUntil?: string;
  pickupPreference?: string;
  images?: string[];
  video?: string;
  createdAt: string;
}

// Where the filters read an offer's city, the offering user's province, category and quantity
const OFFER_GETTERS: OfferGetters<UserWasteOffer> = {
  city: o => o.location?.city,
  state: o => o.user?.address?.state,
  wasteType: o => o.wasteType,
  quantity: o => o.quantity,
};

export default function BrowseUserOffersScreen() {
  const { t } = useTranslation();
  const { wasteCategories } = useAppConfig();
  const { token } = useAuth();
  const [offers, setOffers] = useState<UserWasteOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<OfferFilterState>(EMPTY_OFFER_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchOffers(); }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch(`${API_URL}${ENDPOINTS.COLLECTOR_USER_OFFERS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOffers(data.data || []);
      else Alert.alert('Error', data.message || 'Failed to fetch offers');
    } catch {
      Alert.alert('Error', 'Failed to load offers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredOffers = useMemo(() => filterOffers(offers, filters, OFFER_GETTERS), [offers, filters]);
  const filterCount = activeFilterCount(filters);

  const getWasteType = (wt: string) => wasteCategories.find(t => t.value === wt);

  const renderCard = useCallback(({ item: offer }: { item: UserWasteOffer }) => {
    const wt = getWasteType(offer.wasteType);
    const hasImage = offer.images && offer.images.length > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({
          pathname: '/(collector-tabs)/user-offer-details',
          params: { offerId: offer._id },
        } as any)}
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
          {/* Image count badge */}
          {offer.images && offer.images.length > 1 && (
            <View style={styles.imgCountBadge}>
              <Ionicons name="images-outline" size={11} color="#fff" />
              <Text style={styles.imgCountText}>{offer.images.length}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{offer.wasteType}</Text>
          <Text style={styles.cardPrice}>LKR {offer.expectedPrice}</Text>
          <Text style={styles.cardQty}>{offer.quantity.value} {offer.quantity.unit}</Text>
          <View style={styles.cardUserRow}>
            <Ionicons name="person-outline" size={11} color="#95A5A6" />
            <Text style={styles.cardUserText} numberOfLines={1}>{offer.user?.name}</Text>
          </View>
          <View style={styles.cardLocation}>
            <Ionicons name="location-outline" size={11} color="#95A5A6" />
            <Text style={styles.cardLocationText} numberOfLines={1}>{offer.location.city}</Text>
          </View>
        </View>

        {/* Request to Buy button */}
        <TouchableOpacity
          style={styles.requestBtn}
          onPress={() => router.push({
            pathname: '/(collector-tabs)/user-offer-details',
            params: { offerId: offer._id },
          } as any)}
        >
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={styles.requestBtnText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [filteredOffers]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('screens.browseUserOffers')}</Text>
        <TouchableOpacity onPress={() => setShowFilters(v => !v)} accessibilityLabel="Filter offers">
          <Ionicons name={showFilters ? 'close-circle' : 'filter'} size={24} color="#fff" />
          {!showFilters && <FilterCountBadge count={filterCount} />}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <OfferFilters offers={offers} getters={OFFER_GETTERS} filters={filters} onChange={setFilters} />
      )}

      {/* Results bar */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'} available
        </Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchOffers(); }}>
          <Ionicons name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredOffers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="file-tray-outline" size={72} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Offers Found</Text>
          <Text style={styles.emptyText}>
            {filterCount > 0 ? 'Try adjusting your filters.' : 'No user waste offers are currently available.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOffers}
          keyExtractor={o => o._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          style={styles.list}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  resultsText: { fontSize: 13, fontWeight: '600', color: '#7F8C8D' },
  // flex + background so the green page colour doesn't show below a short list
  list: { flex: 1, backgroundColor: '#F5F6FA' },
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
  imgCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  imgCountText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 2 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  cardQty: { fontSize: 11, color: '#7F8C8D', marginBottom: 3 },
  cardUserRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  cardUserText: { fontSize: 11, color: '#7F8C8D', flex: 1 },
  cardLocation: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  cardLocationText: { fontSize: 11, color: '#95A5A6', flex: 1 },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    marginHorizontal: 10,
    marginBottom: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#7F8C8D', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});
