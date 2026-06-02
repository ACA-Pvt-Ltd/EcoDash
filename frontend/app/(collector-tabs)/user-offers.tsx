import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS,  COLORS } from '@/constants/config';
import { router } from 'expo-router';
import { useAppConfig } from '@/context/AppConfigContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface UserWasteOffer {
  _id: string;
  user: { _id: string; name: string; email: string; phone: string; address: string };
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

export default function BrowseUserOffersScreen() {
  const { wasteCategories } = useAppConfig();
  const { token } = useAuth();
  const [offers, setOffers] = useState<UserWasteOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<UserWasteOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchOffers(); }, []);
  useEffect(() => { applyFilters(); }, [offers, selectedWasteType, citySearch]);

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

  const applyFilters = () => {
    let f = [...offers];
    if (selectedWasteType) f = f.filter(o => o.wasteType === selectedWasteType);
    if (citySearch.trim()) f = f.filter(o => o.location.city.toLowerCase().includes(citySearch.toLowerCase()));
    setFilteredOffers(f);
  };

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
        <Text style={styles.headerTitle}>Browse User Offers</Text>
        <TouchableOpacity onPress={() => setShowFilters(v => !v)}>
          <Ionicons name={showFilters ? 'close-circle' : 'filter'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="#7F8C8D" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by city..."
              value={citySearch}
              onChangeText={setCitySearch}
            />
            {citySearch !== '' && (
              <TouchableOpacity onPress={() => setCitySearch('')}>
                <Ionicons name="close-circle" size={18} color="#95A5A6" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.chip, !selectedWasteType && styles.chipActive]}
              onPress={() => setSelectedWasteType('')}
            >
              <Text style={[styles.chipText, !selectedWasteType && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {wasteCategories.map(type => (
              <TouchableOpacity
                key={type.value}
                style={[styles.chip, selectedWasteType === type.value && { backgroundColor: type.color + '25', borderColor: type.color }]}
                onPress={() => setSelectedWasteType(type.value)}
              >
                <Text style={{ fontSize: 14 }}>{type.icon}</Text>
                <Text style={[styles.chipText, selectedWasteType === type.value && { color: type.color, fontWeight: '700' }]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
            {selectedWasteType || citySearch ? 'Try adjusting your filters.' : 'No user waste offers are currently available.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOffers}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  filtersPanel: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 6,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: '#2C3E50' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: '#7F8C8D', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
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
