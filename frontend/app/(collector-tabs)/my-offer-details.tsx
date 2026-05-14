import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '@/services/api';
import { ENDPOINTS, COLORS, WASTE_TYPES } from '@/constants/config';

const { width } = Dimensions.get('window');

interface Offer {
  _id: string;
  wasteType: string;
  quantity: { value: number; unit: string } | number;
  minPricePerKg: number;
  description?: string;
  status: string;
  images?: string[];
  video?: string;
  createdAt: string;
  expiresAt?: string;
}

interface PurchaseRequest {
  _id: string;
  vendor: { _id: string; name: string };
  offer: string | { _id: string };
  pricePerUnit: number;
  quantity: { value: number; unit: string } | number;
  totalAmount: number;
  status: string;
  notes?: string;
  pickupDate?: string;
  createdAt: string;
}

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: '#27AE60', text: '#fff', label: 'Available' },
  sold: { bg: '#2980B9', text: '#fff', label: 'Sold' },
  pending: { bg: '#F39C12', text: '#fff', label: 'Pending' },
  expired: { bg: '#95A5A6', text: '#fff', label: 'Expired' },
};

const REQ_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF3CD', text: '#856404' },
  accepted: { bg: '#D1E7DD', text: '#0A3622' },
  rejected: { bg: '#F8D7DA', text: '#58151C' },
  completed: { bg: '#CFF4FC', text: '#055160' },
};

function MetaRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <>
      <View style={styles.metaRow}>
        <Ionicons name={icon as any} size={16} color="#7F8C8D" style={styles.metaIcon} />
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
      <View style={styles.divider} />
    </>
  );
}

export default function MyOfferDetailsScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, [offerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [offersRes, reqRes] = await Promise.all([
        api.get(ENDPOINTS.COLLECTOR_OFFERS) as Promise<any>,
        api.get(ENDPOINTS.COLLECTOR_PURCHASE_REQUESTS) as Promise<any>,
      ]);

      if (offersRes.success) {
        const found = (offersRes.data || []).find((o: Offer) => o._id === offerId);
        setOffer(found || null);
      }

      if (reqRes.success) {
        const filtered = (reqRes.data || []).filter((r: PurchaseRequest) => {
          const rOffer = r.offer;
          return typeof rOffer === 'string' ? rOffer === offerId : rOffer?._id === offerId;
        });
        setRequests(filtered);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, price: number) => {
    Alert.alert('Accept Request', `Accept offer of LKR ${price}/kg?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            const res: any = await api.put(`${ENDPOINTS.COLLECTOR_PURCHASE_REQUESTS}/${requestId}/accept`);
            if (res.success) {
              Alert.alert('Accepted!', 'The vendor will be notified.');
              loadData();
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to accept');
          }
        },
      },
    ]);
  };

  const handleReject = async (requestId: string) => {
    Alert.alert('Reject Request', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            const res: any = await api.put(`${ENDPOINTS.COLLECTOR_PURCHASE_REQUESTS}/${requestId}/reject`);
            if (res.success) {
              Alert.alert('Rejected', 'Request has been rejected.');
              loadData();
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to reject');
          }
        },
      },
    ]);
  };

  const handleDelete = async () => {
    if (!offer) return;
    Alert.alert('Delete Offer', 'Permanently delete this offer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res: any = await api.delete(`${ENDPOINTS.COLLECTOR_OFFERS}/${offer._id}`);
            if (res.success) {
              Alert.alert('Deleted', 'Offer has been removed.');
              router.push('/(collector-tabs)/offers' as any);
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveSlide(idx);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(collector-tabs)/offers' as any)}>
            <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loader}>
          <Ionicons name="alert-circle-outline" size={64} color="#BDC3C7" />
          <Text style={styles.notFoundText}>Offer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const wt = WASTE_TYPES.find(t => t.value === offer.wasteType);
  const status = STATUS_COLOR[offer.status] || STATUS_COLOR.available;
  const qty = typeof offer.quantity === 'object'
    ? `${offer.quantity.value} ${offer.quantity.unit}`
    : `${offer.quantity} kg`;

  const mediaItems: { type: 'image' | 'video'; uri: string }[] = [
    ...(offer.images || []).map(uri => ({ type: 'image' as const, uri })),
    ...(offer.video ? [{ type: 'video' as const, uri: offer.video }] : []),
  ];
  if (mediaItems.length === 0) {
    mediaItems.push({ type: 'image', uri: '' });
  }

  const pendingReqs = requests.filter(r => r.status === 'pending');
  const otherReqs = requests.filter(r => r.status !== 'pending');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(collector-tabs)/offers' as any)}>
            <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offer Details</Text>
          {offer.status === 'available' && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={22} color="#E74C3C" />
            </TouchableOpacity>
          )}
          {offer.status !== 'available' && <View style={{ width: 30 }} />}
        </View>

        {/* Carousel */}
        <View style={styles.carouselBox}>
          <FlatList
            ref={carouselRef}
            data={mediaItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onCarouselScroll}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                {item.uri ? (
                  <Image source={{ uri: item.uri }} style={styles.slideImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.slidePlaceholder, { backgroundColor: (wt?.color || '#95A5A6') + '20' }]}>
                    <Text style={styles.placeholderEmoji}>{wt?.icon || '♻️'}</Text>
                  </View>
                )}
                {item.type === 'video' && (
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.9)" />
                  </View>
                )}
              </View>
            )}
          />
          {/* Status pill */}
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={styles.statusPillText}>{status.label}</Text>
          </View>
          {/* Page counter */}
          {mediaItems.length > 1 && (
            <View style={styles.pageBadge}>
              <Text style={styles.pageBadgeText}>{activeSlide + 1}/{mediaItems.length}</Text>
            </View>
          )}
        </View>

        {/* Price & title */}
        <View style={styles.priceBlock}>
          <Text style={styles.priceText}>LKR {offer.minPricePerKg}/kg</Text>
          <Text style={styles.wasteTypeTitle}>{offer.wasteType}</Text>
          {offer.description && (
            <Text style={styles.description}>{offer.description}</Text>
          )}
        </View>

        {/* Metadata */}
        <View style={styles.metaCard}>
          <MetaRow icon="scale-outline" label="Quantity" value={qty} />
          <MetaRow icon="calendar-outline" label="Posted" value={new Date(offer.createdAt).toLocaleDateString()} />
          {offer.expiresAt && (
            <MetaRow icon="time-outline" label="Expires" value={new Date(offer.expiresAt).toLocaleDateString()} />
          )}
          <MetaRow
            icon="information-circle-outline"
            label="Status"
            value={status.label}
          />
        </View>

        {/* Purchase Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Purchase Requests
            {requests.length > 0 ? ` (${requests.length})` : ''}
          </Text>

          {requests.length === 0 ? (
            <View style={styles.noRequests}>
              <Ionicons name="mail-outline" size={36} color="#BDC3C7" />
              <Text style={styles.noRequestsText}>No requests yet</Text>
            </View>
          ) : (
            <>
              {pendingReqs.length > 0 && (
                <>
                  <Text style={styles.reqGroupLabel}>Pending</Text>
                  {pendingReqs.map(req => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      onAccept={() => handleAccept(req._id, req.pricePerUnit)}
                      onReject={() => handleReject(req._id)}
                    />
                  ))}
                </>
              )}
              {otherReqs.length > 0 && (
                <>
                  <Text style={styles.reqGroupLabel}>Other</Text>
                  {otherReqs.map(req => (
                    <RequestCard key={req._id} request={req} />
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RequestCard({
  request,
  onAccept,
  onReject,
}: {
  request: PurchaseRequest;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const reqStatus = REQ_STATUS_COLOR[request.status] || REQ_STATUS_COLOR.pending;
  const qty = typeof request.quantity === 'object'
    ? `${request.quantity.value} ${request.quantity.unit}`
    : `${request.quantity} kg`;

  return (
    <View style={styles.reqCard}>
      <View style={styles.reqCardHeader}>
        <View style={styles.reqVendorRow}>
          <View style={styles.reqAvatar}>
            <Text style={styles.reqAvatarText}>
              {(request.vendor?.name || 'V')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.reqVendorName}>{request.vendor?.name || 'Unknown Vendor'}</Text>
            <Text style={styles.reqDate}>{new Date(request.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={[styles.reqStatusBadge, { backgroundColor: reqStatus.bg }]}>
          <Text style={[styles.reqStatusText, { color: reqStatus.text }]}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.reqMeta}>
        <View style={styles.reqMetaItem}>
          <Text style={styles.reqMetaLabel}>Price/kg</Text>
          <Text style={styles.reqMetaValue}>LKR {request.pricePerUnit}</Text>
        </View>
        <View style={styles.reqMetaDivider} />
        <View style={styles.reqMetaItem}>
          <Text style={styles.reqMetaLabel}>Quantity</Text>
          <Text style={styles.reqMetaValue}>{qty}</Text>
        </View>
        <View style={styles.reqMetaDivider} />
        <View style={styles.reqMetaItem}>
          <Text style={styles.reqMetaLabel}>Total</Text>
          <Text style={styles.reqMetaValue}>LKR {request.totalAmount}</Text>
        </View>
      </View>

      {request.notes && (
        <Text style={styles.reqNotes}>"{request.notes}"</Text>
      )}

      {request.status === 'pending' && onAccept && onReject && (
        <View style={styles.reqActions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  notFoundText: { fontSize: 16, color: '#95A5A6', marginTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  deleteBtn: { padding: 4 },
  // Carousel
  carouselBox: { width, height: 280, position: 'relative', backgroundColor: '#F5F6FA' },
  slide: { width, height: 280 },
  slideImage: { width: '100%', height: '100%' },
  slidePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 72 },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statusPill: {
    position: 'absolute', top: 12, left: 12,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  pageBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  pageBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  // Price block
  priceBlock: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  priceText: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  wasteTypeTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50', marginTop: 4 },
  description: { fontSize: 14, color: '#7F8C8D', marginTop: 8, lineHeight: 20 },
  // Metadata
  metaCard: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
    backgroundColor: '#F5F6FA', borderRadius: 12, overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  metaIcon: { marginRight: 10 },
  metaLabel: { flex: 1, fontSize: 13, color: '#7F8C8D' },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#2C3E50' },
  divider: { height: 1, backgroundColor: '#E8E8E8', marginHorizontal: 16 },
  // Requests section
  section: { padding: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', marginBottom: 12 },
  reqGroupLabel: { fontSize: 12, fontWeight: '700', color: '#95A5A6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  noRequests: { alignItems: 'center', paddingVertical: 32 },
  noRequestsText: { fontSize: 14, color: '#95A5A6', marginTop: 8 },
  reqCard: {
    backgroundColor: '#F5F6FA', borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#E8E8E8',
  },
  reqCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  reqVendorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reqAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary + '25', justifyContent: 'center', alignItems: 'center',
  },
  reqAvatarText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  reqVendorName: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  reqDate: { fontSize: 11, color: '#95A5A6', marginTop: 1 },
  reqStatusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  reqStatusText: { fontSize: 11, fontWeight: '700' },
  reqMeta: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 8, overflow: 'hidden', marginBottom: 10,
  },
  reqMetaItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  reqMetaLabel: { fontSize: 10, color: '#95A5A6', marginBottom: 2 },
  reqMetaValue: { fontSize: 13, fontWeight: '700', color: '#2C3E50' },
  reqMetaDivider: { width: 1, backgroundColor: '#E8E8E8', alignSelf: 'stretch' },
  reqNotes: { fontSize: 13, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 10 },
  reqActions: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E74C3C', paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  rejectBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: 8, gap: 6,
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
