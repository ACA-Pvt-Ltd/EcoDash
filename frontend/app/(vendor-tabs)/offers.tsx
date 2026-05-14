import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { ENDPOINTS, WASTE_TYPES, COLORS } from '@/constants/config';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface CollectorOffer {
  _id: string;
  collector: { _id: string; name: string } | string;
  wasteType: string;
  quantity: { value: number; unit: string } | number;
  minPricePerKg: number;
  description?: string;
  status: string;
  images?: string[];
  video?: string;
  createdAt: string;
}

export default function VendorOffersScreen() {
  const [offers, setOffers] = useState<CollectorOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchOffers(); }, []);

  const fetchOffers = async () => {
    try {
      const response: any = await api.get(ENDPOINTS.VENDOR_OFFERS);
      if (response.success && response.data) {
        setOffers(Array.isArray(response.data) ? response.data : []);
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getWasteType = (wt: string) => WASTE_TYPES.find(t => t.value === wt);

  const getQty = (q: CollectorOffer['quantity']) =>
    typeof q === 'object' ? `${q.value} ${q.unit}` : `${q} kg`;

  const getCollectorName = (c: CollectorOffer['collector']) =>
    typeof c === 'object' ? c.name : 'Collector';

  const renderCard = useCallback(({ item: offer }: { item: CollectorOffer }) => {
    const wt = getWasteType(offer.wasteType);
    const hasImage = offer.images && offer.images.length > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({
          pathname: '/(vendor-tabs)/offer-details',
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
          <Text style={styles.cardPrice}>LKR {offer.minPricePerKg}/kg</Text>
          <Text style={styles.cardQty}>{getQty(offer.quantity)}</Text>
          <View style={styles.cardCollectorRow}>
            <Ionicons name="person-outline" size={11} color="#95A5A6" />
            <Text style={styles.cardCollectorText} numberOfLines={1}>{getCollectorName(offer.collector)}</Text>
          </View>
        </View>

        {/* View details button */}
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push({
            pathname: '/(vendor-tabs)/offer-details',
            params: { offerId: offer._id },
          } as any)}
        >
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={styles.viewBtnText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [offers]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Waste Offers</Text>
          <Text style={styles.headerSub}>Buy waste from collectors</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : offers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="file-tray-outline" size={72} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Offers Available</Text>
          <Text style={styles.emptyText}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(o, i) => o._id || String(i)}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, backgroundColor: '#F5F6FA'  },
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
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
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 44 },
  playBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 2 },
  imgCountBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3 },
  imgCountText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 2 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  cardQty: { fontSize: 11, color: '#7F8C8D', marginBottom: 3 },
  cardCollectorRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  cardCollectorText: { fontSize: 11, color: '#95A5A6', flex: 1 },
  viewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: COLORS.primary, marginHorizontal: 10, marginBottom: 10, paddingVertical: 8, borderRadius: 8 },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#7F8C8D', marginTop: 6 },
});
