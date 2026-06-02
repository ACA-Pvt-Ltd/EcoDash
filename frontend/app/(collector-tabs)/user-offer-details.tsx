import React, { useState, useEffect } from 'react';
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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS,  COLORS } from '@/constants/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppConfig } from '@/context/AppConfigContext';

const { width } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 280;

interface UserWasteOffer {
  _id: string;
  user: { _id: string; name: string; phone?: string; email?: string };
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

interface MyRequest {
  _id: string;
  userOffer: string | { _id: string };
  status: string;
}

export default function UserOfferDetailsScreen() {
  const { wasteCategories } = useAppConfig();
  const { token } = useAuth();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  const [offer, setOffer] = useState<UserWasteOffer | null>(null);
  const [myRequest, setMyRequest] = useState<MyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const wt = wasteCategories.find(t => t.value === offer?.wasteType);

  // Build media array: images first, then video
  const mediaItems: { uri: string; isVideo: boolean }[] = [];
  if (offer?.images) offer.images.forEach(uri => mediaItems.push({ uri, isVideo: false }));
  if (offer?.video) mediaItems.push({ uri: offer.video, isVideo: true });

  useEffect(() => {
    if (offerId) loadData();
  }, [offerId]);

  const loadData = async () => {
    try {
      const [offerRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}${ENDPOINTS.COLLECTOR_USER_OFFERS}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}${ENDPOINTS.COLLECTOR_MY_USER_REQUESTS}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [offerData, requestsData] = await Promise.all([
        offerRes.json(),
        requestsRes.json(),
      ]);

      if (offerData.success) {
        const found = offerData.data?.find((o: UserWasteOffer) => o._id === offerId);
        if (found) setOffer(found);
        else { Alert.alert('Error', 'Offer not found'); router.push('/(collector-tabs)/user-offers' as any); }
      }

      if (requestsData.success) {
        const existing = requestsData.data?.find((r: MyRequest) => {
          const id = typeof r.userOffer === 'string' ? r.userOffer : r.userOffer?._id;
          return id === offerId;
        });
        setMyRequest(existing || null);
      }
    } catch {
      Alert.alert('Error', 'Failed to load offer details.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToBuy = () => {
    if (myRequest) {
      // Already sent — show status
      Alert.alert(
        'Request Already Sent',
        `Your purchase request status: ${myRequest.status.toUpperCase()}`,
        [{ text: 'OK' }]
      );
      return;
    }
    router.push({
      pathname: '/(collector-tabs)/create-purchase-request',
      params: { offerId },
    } as any);
  };

  const handleChat = () => {
    if (!myRequest) {
      Alert.alert(
        'Request Required',
        'You need to send a purchase request before you can chat with this user.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Request',
            onPress: () => router.push({
              pathname: '/(collector-tabs)/create-purchase-request',
              params: { offerId },
            } as any),
          },
        ]
      );
      return;
    }
    // Navigate to chat (pass requestId and user info)
    router.push({
      pathname: '/(collector-tabs)/chat',
      params: {
        requestId: myRequest._id,
        userName: offer?.user?.name || 'User',
        userId: offer?.user?._id,
      },
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push('/(collector-tabs)/user-offers' as any)}>
            <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Offer Details</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!offer) return null;

  const hasRequest = !!myRequest;
  const requestStatus = myRequest?.status;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.push('/(collector-tabs)/user-offers' as any)}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{offer.wasteType}</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Scrollable content */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

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
                onMomentumScrollEnd={e =>
                  setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))
                }
                renderItem={({ item }) => (
                  <View style={styles.slide}>
                    <Image source={{ uri: item.uri }} style={styles.slideImage} />
                    {item.isVideo && (
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
                      </View>
                    )}
                  </View>
                )}
              />
              <View style={styles.pageBadge}>
                <Text style={styles.pageText}>{activeSlide + 1}/{mediaItems.length}</Text>
              </View>
            </>
          ) : (
            <View style={[styles.slide, { backgroundColor: (wt?.color || '#95A5A6') + '15', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 90 }}>{wt?.icon || '♻️'}</Text>
            </View>
          )}
        </View>

        {/* Price + Title block */}
        <View style={styles.priceBlock}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>LKR {offer.expectedPrice.toLocaleString()}</Text>
            {hasRequest && (
              <View style={[styles.requestedBadge, requestStatus === 'accepted' && { backgroundColor: '#2ECC71' }]}>
                <Ionicons
                  name={requestStatus === 'accepted' ? 'checkmark-circle' : 'time-outline'}
                  size={13}
                  color="#fff"
                />
                <Text style={styles.requestedBadgeText}>
                  {requestStatus === 'accepted' ? 'Accepted' : requestStatus === 'rejected' ? 'Rejected' : 'Requested'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.offerTitle}>{offer.wasteType}</Text>
          {offer.description ? (
            <Text style={styles.descText}>{offer.description}</Text>
          ) : null}
        </View>

        {/* Metadata rows */}
        <View style={styles.metaBlock}>
          <MetaRow label="Seller" value={offer.user?.name || '—'} />
          <MetaRow label="Quantity" value={`${offer.quantity.value} ${offer.quantity.unit}`} />
          <MetaRow label="Pickup preference" value={offer.pickupPreference || 'Any time'} />
          <MetaRow label="Available from" value={new Date(offer.availableFrom).toLocaleDateString()} />
          {offer.availableUntil && (
            <MetaRow label="Available until" value={new Date(offer.availableUntil).toLocaleDateString()} />
          )}
          <MetaRow label="Address" value={offer.location.address} />
          <MetaRow label="City" value={offer.location.city} last />
        </View>

        {/* Posted date */}
        <Text style={styles.postedText}>
          Posted {new Date(offer.createdAt).toLocaleDateString()}
        </Text>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        {/* Chat button */}
        <TouchableOpacity
          style={[styles.chatBtn, !hasRequest && styles.chatBtnDisabled]}
          onPress={handleChat}
        >
          <Ionicons name="chatbubble-outline" size={20} color={hasRequest ? COLORS.primary : '#BDC3C7'} />
          <Text style={[styles.chatBtnText, !hasRequest && styles.chatBtnTextDisabled]}>Chat</Text>
          {!hasRequest && (
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={10} color="#BDC3C7" />
            </View>
          )}
        </TouchableOpacity>

        {/* Request / Status button */}
        <TouchableOpacity
          style={[
            styles.requestBtn,
            hasRequest && requestStatus === 'rejected' && styles.requestBtnRejected,
            hasRequest && requestStatus !== 'rejected' && styles.requestBtnSent,
          ]}
          onPress={handleRequestToBuy}
        >
          <Ionicons
            name={hasRequest ? (requestStatus === 'accepted' ? 'checkmark-circle' : 'time-outline') : 'cart-outline'}
            size={20}
            color="#fff"
          />
          <Text style={styles.requestBtnText}>
            {hasRequest
              ? requestStatus === 'accepted'
                ? 'Request Accepted'
                : requestStatus === 'rejected'
                ? 'Request Rejected'
                : 'Request Sent'
              : 'Request to Buy'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MetaRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <>
      <View style={metaStyles.row}>
        <Text style={metaStyles.label}>{label}</Text>
        <Text style={metaStyles.value} numberOfLines={2}>{value}</Text>
      </View>
      {!last && <View style={metaStyles.divider} />}
    </>
  );
}

const metaStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  value: { fontSize: 14, color: '#7F8C8D', textAlign: 'right', flex: 1, marginLeft: 16 },
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
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scroll: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Carousel
  carouselWrap: { height: CAROUSEL_HEIGHT, backgroundColor: '#111', position: 'relative' },
  slide: { width, height: CAROUSEL_HEIGHT },
  slideImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  videoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  pageBadge: {
    position: 'absolute', bottom: 14, right: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  pageText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Price block
  priceBlock: { backgroundColor: '#fff', padding: 20, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  priceText: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  requestedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F39C12',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
  },
  requestedBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  offerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50', marginBottom: 6 },
  descText: { fontSize: 14, color: '#7F8C8D', lineHeight: 21 },

  // Meta block
  metaBlock: { backgroundColor: '#fff', marginBottom: 8 },

  postedText: { fontSize: 12, color: '#95A5A6', textAlign: 'center', paddingVertical: 12 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 10,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    position: 'relative',
  },
  chatBtnDisabled: { borderColor: '#E0E0E0' },
  chatBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  chatBtnTextDisabled: { color: '#BDC3C7' },
  lockIcon: { position: 'absolute', top: 6, right: 6 },
  requestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  requestBtnSent: { backgroundColor: '#F39C12' },
  requestBtnRejected: { backgroundColor: '#E74C3C' },
  requestBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
