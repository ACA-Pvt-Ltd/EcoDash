import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/services/api';
import { ENDPOINTS,  COLORS } from '@/constants/config';
import { router } from 'expo-router';
import { useAppConfig } from '@/context/AppConfigContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ── Offer types ──────────────────────────────────────────────────────────────
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

// ── Purchase types ────────────────────────────────────────────────────────────
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

const PURCHASE_STATUS: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pending:   { bg: '#FFF3CD', text: '#856404', label: 'Pending',   icon: 'time-outline' },
  accepted:  { bg: '#D1E7DD', text: '#0A3622', label: 'Accepted',  icon: 'checkmark-circle-outline' },
  rejected:  { bg: '#F8D7DA', text: '#58151C', label: 'Rejected',  icon: 'close-circle-outline' },
  completed: { bg: '#CFF4FC', text: '#055160', label: 'Completed', icon: 'checkmark-done-circle-outline' },
  cancelled: { bg: '#E2E3E5', text: '#41464B', label: 'Cancelled', icon: 'ban-outline' },
};

const PURCHASE_FILTER_TABS = ['all', 'pending', 'accepted', 'completed', 'rejected'] as const;
type PurchaseTab = typeof PURCHASE_FILTER_TABS[number];

function getPurchaseQty(q: Purchase['quantity']) {
  return typeof q === 'object' ? `${q.value} ${q.unit}` : `${q} kg`;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function VendorOffersScreen() {
  const { wasteCategories } = useAppConfig();
  const [section, setSection] = useState<'offers' | 'purchases'>('offers');

  // Offers state
  const [offers, setOffers] = useState<CollectorOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(true);
  const [offersRefreshing, setOffersRefreshing] = useState(false);

  // Purchases state
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchasesRefreshing, setPurchasesRefreshing] = useState(false);
  const [purchaseTab, setPurchaseTab] = useState<PurchaseTab>('all');

  const fetchOffers = useCallback(async () => {
    try {
      const res: any = await api.get(ENDPOINTS.VENDOR_OFFERS);
      if (res.success && res.data) {
        const all: CollectorOffer[] = Array.isArray(res.data) ? res.data : [];
        setOffers(all.filter(o => o.status === 'available'));
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
    } finally {
      setOffersLoading(false);
      setOffersRefreshing(false);
    }
  }, []);

  const fetchPurchases = useCallback(async () => {
    try {
      const res: any = await api.get(ENDPOINTS.VENDOR_PURCHASES);
      if (res.success) setPurchases(res.data || []);
      else setPurchases([]);
    } catch {
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
      setPurchasesRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchOffers();
    fetchPurchases();
  }, [fetchOffers, fetchPurchases]));

  // ── Offer handlers ──────────────────────────────────────────────────────────
  const getWasteType = (wt: string) => wasteCategories.find(t => t.value === wt);
  const getOfferQty = (q: CollectorOffer['quantity']) =>
    typeof q === 'object' ? `${q.value} ${q.unit}` : `${q} kg`;
  const getCollectorName = (c: CollectorOffer['collector']) =>
    typeof c === 'object' ? c.name : 'Collector';

  const renderOfferCard = useCallback(({ item: offer }: { item: CollectorOffer }) => {
    const wt = getWasteType(offer.wasteType);
    const hasImage = offer.images && offer.images.length > 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/(vendor-tabs)/offer-details', params: { offerId: offer._id } } as any)}
      >
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
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{offer.wasteType}</Text>
          <Text style={styles.cardPrice}>LKR {offer.minPricePerKg}/kg</Text>
          <Text style={styles.cardQty}>{getOfferQty(offer.quantity)}</Text>
          <View style={styles.cardCollectorRow}>
            <Ionicons name="person-outline" size={11} color="#95A5A6" />
            <Text style={styles.cardCollectorText} numberOfLines={1}>{getCollectorName(offer.collector)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push({ pathname: '/(vendor-tabs)/offer-details', params: { offerId: offer._id } } as any)}
        >
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={styles.viewBtnText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, []);

  // ── Purchase handlers ───────────────────────────────────────────────────────
  const handleCancel = (purchaseId: string) => {
    Alert.alert('Cancel Purchase', 'Are you sure you want to cancel this purchase request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Request', style: 'destructive',
        onPress: async () => {
          try {
            const res: any = await api.put(ENDPOINTS.VENDOR_CANCEL_PURCHASE(purchaseId));
            if (res.success) {
              Alert.alert('Cancelled', 'Purchase request has been cancelled.');
              fetchPurchases();
              fetchOffers();
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

  const filteredPurchases = purchaseTab === 'all'
    ? purchases
    : purchases.filter(p => p.status === purchaseTab);

  const renderPurchaseCard = ({ item }: { item: Purchase }) => {
    const cfg = PURCHASE_STATUS[item.status] || PURCHASE_STATUS.pending;
    const collectorName = item.collector?.name || 'Unknown Collector';
    return (
      <View style={styles.pCard}>
        <View style={styles.pCardHeader}>
          <View style={styles.pCardLeft}>
            <View style={styles.pAvatar}>
              <Text style={styles.pAvatarText}>{collectorName[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.pCollectorName}>{collectorName}</Text>
              <Text style={styles.pDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          <View style={[styles.pStatusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={12} color={cfg.text} />
            <Text style={[styles.pStatusText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>

        <Text style={styles.pWasteType}>{item.wasteType}</Text>

        <View style={styles.pMetaRow}>
          <View style={styles.pMetaItem}>
            <Text style={styles.pMetaLabel}>Qty</Text>
            <Text style={styles.pMetaValue}>{getPurchaseQty(item.quantity)}</Text>
          </View>
          <View style={styles.pMetaDivider} />
          <View style={styles.pMetaItem}>
            <Text style={styles.pMetaLabel}>Price/kg</Text>
            <Text style={styles.pMetaValue}>LKR {item.pricePerUnit}</Text>
          </View>
          <View style={styles.pMetaDivider} />
          <View style={styles.pMetaItem}>
            <Text style={styles.pMetaLabel}>Total</Text>
            <Text style={[styles.pMetaValue, { color: COLORS.primary }]}>LKR {item.totalAmount}</Text>
          </View>
        </View>

        {item.notes ? <Text style={styles.pNotes}>&ldquo;{item.notes}&rdquo;</Text> : null}

        <View style={styles.pActions}>
          {(item.status === 'pending' || item.status === 'accepted') && (
            <TouchableOpacity style={styles.pChatBtn} onPress={() => handleChat(item)}>
              <Ionicons name="chatbubble-outline" size={15} color={COLORS.primary} />
              <Text style={styles.pChatBtnText}>Chat</Text>
            </TouchableOpacity>
          )}
          {item.status === 'pending' && (
            <TouchableOpacity style={styles.pCancelBtn} onPress={() => handleCancel(item._id)}>
              <Ionicons name="close-circle-outline" size={15} color="#E74C3C" />
              <Text style={styles.pCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {section === 'offers' ? 'Waste Offers' : 'My Purchases'}
        </Text>
        <Text style={styles.headerSub}>
          {section === 'offers' ? 'Buy waste from collectors' : 'Track your purchase requests'}
        </Text>

        {/* Top toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, section === 'offers' && styles.toggleBtnActive]}
            onPress={() => setSection('offers')}
          >
            <Ionicons name="bag-outline" size={15} color={section === 'offers' ? COLORS.primary : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.toggleBtnText, section === 'offers' && styles.toggleBtnTextActive]}>Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, section === 'purchases' && styles.toggleBtnActive]}
            onPress={() => setSection('purchases')}
          >
            <Ionicons name="receipt-outline" size={15} color={section === 'purchases' ? COLORS.primary : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.toggleBtnText, section === 'purchases' && styles.toggleBtnTextActive]}>
              My Purchases{purchases.filter(p => p.status === 'pending').length > 0
                ? ` (${purchases.filter(p => p.status === 'pending').length})`
                : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
      {/* ── Offers section ── */}
      {section === 'offers' && (
        offersLoading ? (
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
            renderItem={renderOfferCard}
            refreshControl={
              <RefreshControl
                refreshing={offersRefreshing}
                onRefresh={() => { setOffersRefreshing(true); fetchOffers(); }}
                colors={[COLORS.primary]}
              />
            }
          />
        )
      )}

      {/* ── Purchases section ── */}
      {section === 'purchases' && (
        <>
          {/* Filter tabs */}
          <View style={styles.filterRow}>
            {PURCHASE_FILTER_TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, purchaseTab === tab && styles.filterTabActive]}
                onPress={() => setPurchaseTab(tab)}
              >
                <Text style={[styles.filterTabText, purchaseTab === tab && styles.filterTabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {purchasesLoading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
          ) : (
            <FlatList
              data={filteredPurchases}
              keyExtractor={p => p._id}
              contentContainerStyle={styles.pList}
              renderItem={renderPurchaseCard}
              refreshControl={
                <RefreshControl
                  refreshing={purchasesRefreshing}
                  onRefresh={() => { setPurchasesRefreshing(true); fetchPurchases(); }}
                  colors={[COLORS.primary]}
                />
              }
              ListEmptyComponent={
                <View style={styles.center}>
                  <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
                  <Text style={styles.emptyTitle}>No purchases yet</Text>
                  <Text style={styles.emptyText}>
                    {purchaseTab === 'all' ? 'Browse offers and make your first purchase' : `No ${purchaseTab} purchases`}
                  </Text>
                  {purchaseTab === 'all' && (
                    <TouchableOpacity style={styles.browseBtn} onPress={() => setSection('offers')}>
                      <Text style={styles.browseBtnText}>Browse Offers</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          )}
        </>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  content: { flex: 1, backgroundColor: '#F5F6FA' },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, marginBottom: 14 },

  // Toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 9,
  },
  toggleBtnActive: { backgroundColor: '#fff' },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  toggleBtnTextActive: { color: COLORS.primary },

  // Offers grid
  listContent: { padding: 16, backgroundColor: '#F5F6FA' },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: {
    width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  imageBox: { width: '100%', height: 130, position: 'relative' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 44 },
  playBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 2 },
  imgCountBadge: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center',
    gap: 3, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3,
  },
  imgCountText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 2 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  cardQty: { fontSize: 11, color: '#7F8C8D', marginBottom: 3 },
  cardCollectorRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 },
  cardCollectorText: { fontSize: 11, color: '#95A5A6', flex: 1 },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: COLORS.primary, marginHorizontal: 10, marginBottom: 10, paddingVertical: 8, borderRadius: 8,
  },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Purchases filter bar
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10,
    gap: 6, backgroundColor: '#F5F6FA', borderBottomWidth: 1, borderBottomColor: '#E8E8E8',
  },
  filterTab: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#7F8C8D' },
  filterTabTextActive: { color: '#fff' },

  // Purchase cards
  pList: { padding: 16, paddingBottom: 32, backgroundColor: '#F5F6FA' },
  pCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#E8E8E8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  pCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center' },
  pAvatarText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  pCollectorName: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  pDate: { fontSize: 11, color: '#95A5A6', marginTop: 1 },
  pStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  pStatusText: { fontSize: 11, fontWeight: '700' },
  pWasteType: { fontSize: 15, fontWeight: '700', color: '#2C3E50', marginBottom: 10 },
  pMetaRow: { flexDirection: 'row', backgroundColor: '#F5F6FA', borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  pMetaItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  pMetaLabel: { fontSize: 10, color: '#95A5A6', marginBottom: 2 },
  pMetaValue: { fontSize: 13, fontWeight: '700', color: '#2C3E50' },
  pMetaDivider: { width: 1, backgroundColor: '#E8E8E8', alignSelf: 'stretch' },
  pNotes: { fontSize: 13, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 10 },
  pActions: { flexDirection: 'row', gap: 10 },
  pChatBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 8, paddingVertical: 9,
  },
  pChatBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  pCancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#E74C3C', borderRadius: 8, paddingVertical: 9,
  },
  pCancelBtnText: { fontSize: 13, fontWeight: '700', color: '#E74C3C' },

  // Shared
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginTop: 12 },
  emptyText: { fontSize: 13, color: '#7F8C8D', marginTop: 6, textAlign: 'center' },
  browseBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
