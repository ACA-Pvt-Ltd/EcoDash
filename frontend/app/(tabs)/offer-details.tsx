import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS, WASTE_TYPES, COLORS } from '@/constants/config';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 280;

interface PurchaseRequest {
  _id: string;
  collector: { _id: string; name: string; phone?: string; email?: string; businessName?: string };
  proposedPrice: number;
  offeredPrice: number;
  proposedPickupTime?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  finalPayment?: number;
}

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
}

const STATUS_COLOR: Record<string, string> = {
  available: '#2ECC71',
  pending: '#F39C12',
  sold: '#3498DB',
  cancelled: '#E74C3C',
};

const REQUEST_STATUS_COLOR: Record<string, string> = {
  pending: '#F39C12',
  accepted: '#2ECC71',
  rejected: '#E74C3C',
  completed: '#3498DB',
};

export default function OfferDetailsScreen() {
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offer, setOffer] = useState<UserWasteOffer | null>(null);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const mediaItems: { uri: string; isVideo: boolean }[] = [];
  if (offer?.images) offer.images.forEach(uri => mediaItems.push({ uri, isVideo: false }));
  if (offer?.video) mediaItems.push({ uri: offer.video, isVideo: true });

  const wt = WASTE_TYPES.find(t => t.value === offer?.wasteType);

  const fetchOfferDetails = async () => {
    try {
      const res = await fetch(`${API_URL}${ENDPOINTS.USER_OFFERS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const found = data.data?.find((o: UserWasteOffer) => o._id === id);
        if (found) setOffer(found);
        else { Alert.alert('Error', 'Offer not found'); router.push('/(tabs)/offers' as any); }
      }
    } catch { Alert.alert('Error', 'Failed to load offer details.'); }
    finally { setLoading(false); }
  };

  const fetchPurchaseRequests = async () => {
    try {
      const res = await fetch(`${API_URL}${ENDPOINTS.USER_PURCHASE_REQUESTS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const filtered = data.data?.filter((r: any) => (r.userOffer?._id || r.userOffer) === id) || [];
        setRequests(filtered);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (id) { fetchOfferDetails(); fetchPurchaseRequests(); }
  }, [id]);

  const handleRespond = (requestId: string, action: 'accepted' | 'rejected') => {
    Alert.alert(
      action === 'accepted' ? 'Accept Request' : 'Reject Request',
      `Are you sure you want to ${action === 'accepted' ? 'accept' : 'reject'} this request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'accepted' ? 'Accept' : 'Reject',
          style: action === 'accepted' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}${ENDPOINTS.USER_RESPOND_REQUEST(requestId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: action }),
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert('Success', action === 'accepted' ? 'Request accepted!' : 'Request rejected');
                fetchOfferDetails();
                fetchPurchaseRequests();
              } else Alert.alert('Error', data.message);
            } catch { Alert.alert('Error', 'Action failed.'); }
          },
        },
      ]
    );
  };

  const deleteOffer = () => {
    Alert.alert('Delete Offer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}${ENDPOINTS.USER_DELETE_OFFER(id)}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) Alert.alert('Success', 'Offer deleted', [{ text: 'OK', onPress: () => router.push('/(tabs)/offers' as any) }]);
            else Alert.alert('Error', data.message);
          } catch { Alert.alert('Error', 'Failed to delete offer.'); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/offers' as any)}>
            <Ionicons name="chevron-back" size={26} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Offer Details</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color="#2ECC71" /></View>
      </SafeAreaView>
    );
  }

  if (!offer) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/offers' as any)}>
          <Ionicons name="chevron-back" size={26} color="#2ECC71" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{offer.wasteType}</Text>
        {offer.status === 'available'
          ? <TouchableOpacity onPress={deleteOffer}><Ionicons name="trash-outline" size={22} color="#E74C3C" /></TouchableOpacity>
          : <View style={{ width: 26 }} />}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.carouselWrap}>
          {mediaItems.length > 0 ? (
            <>
              <FlatList
                data={mediaItems}
                keyExtractor={(_, i) => String(i)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => {
                  setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width));
                }}
                renderItem={({ item }) => (
                  <View style={styles.slide}>
                    <Image source={{ uri: item.uri }} style={styles.slideImage} />
                    {item.isVideo && (
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
                      </View>
                    )}
                  </View>
                )}
              />
              {/* Page counter */}
              <View style={styles.pageBadge}>
                <Text style={styles.pageText}>{activeSlide + 1}/{mediaItems.length}</Text>
              </View>
            </>
          ) : (
            <View style={[styles.slide, styles.carouselPlaceholder, { backgroundColor: (wt?.color || '#95A5A6') + '15' }]}>
              <Text style={{ fontSize: 80 }}>{wt?.icon || '♻️'}</Text>
            </View>
          )}
          {/* Status badge overlay */}
          <View style={[styles.statusOverlay, { backgroundColor: STATUS_COLOR[offer.status] || '#95A5A6' }]}>
            <Text style={styles.statusOverlayText}>{offer.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Price + Title */}
        <View style={styles.priceSection}>
          <Text style={styles.priceText}>LKR {offer.expectedPrice.toLocaleString()}</Text>
          <Text style={styles.offerTitle}>{offer.wasteType}</Text>
          {offer.description && (
            <Text style={styles.descText}>{offer.description}</Text>
          )}
        </View>

        {/* Metadata rows */}
        <View style={styles.metaCard}>
          <MetaRow label="Quantity" value={`${offer.quantity.value} ${offer.quantity.unit}`} />
          <MetaRow label="Pickup time" value={offer.pickupPreference || '—'} />
          <MetaRow label="Available from" value={new Date(offer.availableFrom).toLocaleDateString()} />
          {offer.availableUntil && (
            <MetaRow label="Available until" value={new Date(offer.availableUntil).toLocaleDateString()} last={!offer.location} />
          )}
          <MetaRow label="Address" value={offer.location.address} />
          <MetaRow label="City" value={offer.location.city} last />
        </View>

        {/* Purchase Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Requests ({requests.length})</Text>
          {requests.length === 0 ? (
            <View style={styles.emptyRequests}>
              <Text style={styles.emptyRequestsText}>
                No purchase requests yet. Collectors will see your offer and can send requests.
              </Text>
            </View>
          ) : (
            requests.map(req => (
              <View key={req._id} style={styles.reqCard}>
                <View style={styles.reqHeader}>
                  <View>
                    <Text style={styles.reqCollectorName}>{req.collector?.name || 'Unknown Collector'}</Text>
                    {req.collector?.phone && <Text style={styles.reqCollectorPhone}>{req.collector.phone}</Text>}
                  </View>
                  <View style={[styles.reqStatusBadge, { backgroundColor: REQUEST_STATUS_COLOR[req.status] || '#95A5A6' }]}>
                    <Text style={styles.reqStatusText}>{req.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.reqMeta}>
                  <MetaRow label="Offered Price" value={`LKR ${req.proposedPrice || req.offeredPrice}`} />
                  {req.proposedPickupTime && (
                    <MetaRow label="Pickup Time" value={new Date(req.proposedPickupTime).toLocaleDateString()} />
                  )}
                  {req.status === 'completed' && req.finalPayment && (
                    <MetaRow label="Final Payment" value={`LKR ${req.finalPayment}`} last />
                  )}
                </View>

                {req.message && (
                  <View style={styles.reqMessage}>
                    <Text style={styles.reqMessageLabel}>Message</Text>
                    <Text style={styles.reqMessageText}>{req.message}</Text>
                  </View>
                )}

                {req.status === 'pending' && (
                  <View style={styles.reqActions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRespond(req._id, 'accepted')}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRespond(req._id, 'rejected')}>
                      <Ionicons name="close-circle" size={18} color="#fff" />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {req.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => router.push({
                      pathname: '/(tabs)/chat',
                      params: {
                        collectorName: req.collector?.name || 'Collector',
                        requestId: req._id,
                      },
                    } as any)}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.chatBtnText}>Chat with Collector</Text>
                  </TouchableOpacity>
                )}

                {req.status === 'accepted' && (
                  <View style={styles.bannerGreen}>
                    <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
                    <Text style={styles.bannerText}>Accepted — waiting for collector to complete pickup</Text>
                  </View>
                )}

                {req.status === 'completed' && (
                  <View style={styles.bannerGold}>
                    <Ionicons name="trophy" size={20} color="#D68910" />
                    <Text style={[styles.bannerText, { color: '#D68910' }]}>
                      Completed — you received LKR {req.finalPayment || req.proposedPrice}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <>
      <View style={metaStyles.row}>
        <Text style={metaStyles.label}>{label}</Text>
        <Text style={metaStyles.value}>{value}</Text>
      </View>
      {!last && <View style={metaStyles.divider} />}
    </>
  );
}

const metaStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16 },
  label: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  value: { fontSize: 14, color: '#7F8C8D', textAlign: 'right', flex: 1, marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scroll: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  carouselWrap: { position: 'relative', height: CAROUSEL_HEIGHT, backgroundColor: '#1a1a1a' },
  slide: { width, height: CAROUSEL_HEIGHT },
  slideImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  carouselPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  videoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  pageBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pageText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  statusOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusOverlayText: { fontSize: 11, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  priceSection: { backgroundColor: '#fff', padding: 20, marginBottom: 8 },
  priceText: { fontSize: 28, fontWeight: '800', color: '#2ECC71', marginBottom: 4 },
  offerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50', marginBottom: 8 },
  descText: { fontSize: 14, color: '#7F8C8D', lineHeight: 21 },
  metaCard: { backgroundColor: '#fff', marginBottom: 8 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginBottom: 12, marginTop: 8 },
  emptyRequests: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  emptyRequestsText: { fontSize: 13, color: '#7F8C8D', textAlign: 'center', lineHeight: 20 },
  reqCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 0,
  },
  reqCollectorName: { fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  reqCollectorPhone: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  reqStatusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  reqStatusText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  reqMeta: { borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 12 },
  reqMessage: { backgroundColor: '#F5F6FA', marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 8 },
  reqMessageLabel: { fontSize: 11, fontWeight: '700', color: '#7F8C8D', marginBottom: 4 },
  reqMessageText: { fontSize: 13, color: '#2C3E50', lineHeight: 18 },
  reqActions: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 4 },
  acceptBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: '#2ECC71', paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: '#E74C3C', paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  bannerGreen: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#D5F4E6', margin: 16, marginTop: 4, padding: 12, borderRadius: 8 },
  bannerGold: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#FEF5E7', margin: 16, marginTop: 4, padding: 12, borderRadius: 8 },
  bannerText: { fontSize: 13, color: '#27AE60', flex: 1, lineHeight: 18 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginHorizontal: 16, marginBottom: 14, paddingVertical: 11,
    borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  chatBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
