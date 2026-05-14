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
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { ENDPOINTS, WASTE_TYPES, COLORS } from '@/constants/config';
import { router, useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 280;

interface CollectorOffer {
  _id: string;
  collector: { _id: string; name: string; phone?: string; email?: string; businessName?: string };
  wasteType: string;
  quantity: { value: number; unit: string } | number;
  minPricePerKg: number;
  description?: string;
  status: string;
  expiresAt?: string;
  location?: any;
  images?: string[];
  video?: string;
  createdAt: string;
}

interface MyPurchase {
  _id: string;
  offer?: string | { _id: string };
  offerId?: string;
  status: string;
}

export default function VendorOfferDetailsScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  const [offer, setOffer] = useState<CollectorOffer | null>(null);
  const [myPurchase, setMyPurchase] = useState<MyPurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Purchase modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [pricePerKg, setPricePerKg] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const wt = WASTE_TYPES.find(t => t.value === offer?.wasteType);

  const mediaItems: { uri: string; isVideo: boolean }[] = [];
  if (offer?.images) offer.images.forEach(uri => mediaItems.push({ uri, isVideo: false }));
  if (offer?.video) mediaItems.push({ uri: offer.video, isVideo: true });

  const qty = typeof offer?.quantity === 'object' ? offer.quantity.value : offer?.quantity;
  const qtyUnit = typeof offer?.quantity === 'object' ? offer.quantity.unit : 'kg';

  useEffect(() => {
    if (offerId) loadData();
  }, [offerId]);

  const loadData = async () => {
    try {
      const [offersRes, purchasesRes]: any[] = await Promise.all([
        api.get(ENDPOINTS.VENDOR_OFFERS),
        api.get(ENDPOINTS.VENDOR_PURCHASES),
      ]);

      if (offersRes.success) {
        const found = offersRes.data?.find((o: CollectorOffer) => o._id === offerId);
        if (found) setOffer(found);
        else { Alert.alert('Error', 'Offer not found'); router.push('/(vendor-tabs)/offers' as any); }
      }

      if (purchasesRes.success) {
        const existing = purchasesRes.data?.find((p: MyPurchase) => {
          const id = p.offerId || (typeof p.offer === 'string' ? p.offer : p.offer?._id);
          return id === offerId;
        });
        setMyPurchase(existing || null);
      }
    } catch {
      Alert.alert('Error', 'Failed to load offer details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (myPurchase) {
      Alert.alert('Purchase Already Made', `Status: ${myPurchase.status.toUpperCase()}`);
      return;
    }
    setPricePerKg('');
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    const price = parseFloat(pricePerKg);
    if (!price || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price per kg.');
      return;
    }
    if (!offer) return;

    setPurchasing(true);
    try {
      const response: any = await api.post(ENDPOINTS.VENDOR_PURCHASE, {
        offerId: offer._id,
        collectorId: typeof offer.collector === 'object' ? offer.collector._id : offer.collector,
        wasteType: offer.wasteType,
        quantity: qty,
        pricePerUnit: price,
        notes: `Purchased via EcoDash`,
      });

      if (response.success) {
        setShowPurchaseModal(false);
        Alert.alert(
          'Purchase Sent!',
          `Your purchase request has been sent.\n\nTotal: LKR ${(price * (qty || 0)).toFixed(2)}`,
          [{ text: 'OK', onPress: loadData }]
        );
      } else {
        Alert.alert('Error', response.message || 'Purchase failed');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const handleChat = () => {
    if (!myPurchase) {
      Alert.alert(
        'Purchase Required',
        'You need to make a purchase request before you can chat with this collector.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Purchase', onPress: handlePurchase },
        ]
      );
      return;
    }
    router.push({
      pathname: '/(vendor-tabs)/chat',
      params: {
        purchaseId: myPurchase._id,
        collectorName: typeof offer?.collector === 'object' ? offer.collector.name : 'Collector',
        collectorId: typeof offer?.collector === 'object' ? offer.collector._id : offer?.collector,
      },
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push('/(vendor-tabs)/offers' as any)}>
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

  const hasPurchase = !!myPurchase;
  const purchaseStatus = myPurchase?.status;

  const collectorName = typeof offer.collector === 'object' ? offer.collector.name : 'Collector';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.push('/(vendor-tabs)/offers' as any)}>
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{offer.wasteType}</Text>
        <View style={{ width: 26 }} />
      </View>

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

        {/* Price + Title */}
        <View style={styles.priceBlock}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>
              LKR {offer.minPricePerKg}/kg
            </Text>
            {hasPurchase && (
              <View style={[styles.statusBadge,
                purchaseStatus === 'completed' && { backgroundColor: '#2ECC71' },
                purchaseStatus === 'cancelled' && { backgroundColor: '#E74C3C' },
              ]}>
                <Ionicons
                  name={purchaseStatus === 'completed' ? 'checkmark-circle' : 'time-outline'}
                  size={13} color="#fff"
                />
                <Text style={styles.statusBadgeText}>
                  {purchaseStatus === 'completed' ? 'Completed'
                    : purchaseStatus === 'cancelled' ? 'Cancelled'
                    : purchaseStatus === 'accepted' ? 'Accepted'
                    : 'Requested'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.offerTitle}>{offer.wasteType}</Text>
          {offer.description ? <Text style={styles.descText}>{offer.description}</Text> : null}
        </View>

        {/* Metadata rows */}
        <View style={styles.metaBlock}>
          <MetaRow label="Collector" value={collectorName} />
          <MetaRow label="Quantity" value={`${qty} ${qtyUnit}`} />
          <MetaRow label="Min price" value={`LKR ${offer.minPricePerKg}/kg`} />
          <MetaRow label="Status" value={offer.status} />
          {offer.expiresAt && (
            <MetaRow label="Expires" value={new Date(offer.expiresAt).toLocaleDateString()} />
          )}
          <MetaRow label="Posted" value={new Date(offer.createdAt).toLocaleDateString()} last />
        </View>

      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        {/* Chat button */}
        <TouchableOpacity
          style={[styles.chatBtn, !hasPurchase && styles.chatBtnDisabled]}
          onPress={handleChat}
        >
          <Ionicons name="chatbubble-outline" size={20} color={hasPurchase ? COLORS.primary : '#BDC3C7'} />
          <Text style={[styles.chatBtnText, !hasPurchase && styles.chatBtnTextDisabled]}>Chat</Text>
          {!hasPurchase && (
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed" size={10} color="#BDC3C7" />
            </View>
          )}
        </TouchableOpacity>

        {/* Purchase button */}
        <TouchableOpacity
          style={[
            styles.purchaseBtn,
            hasPurchase && purchaseStatus === 'cancelled' && styles.purchaseBtnCancelled,
            hasPurchase && purchaseStatus !== 'cancelled' && styles.purchaseBtnSent,
          ]}
          onPress={handlePurchase}
        >
          <Ionicons
            name={hasPurchase ? (purchaseStatus === 'completed' ? 'checkmark-circle' : 'time-outline') : 'cart-outline'}
            size={20} color="#fff"
          />
          <Text style={styles.purchaseBtnText}>
            {hasPurchase
              ? purchaseStatus === 'completed' ? 'Purchase Completed'
                : purchaseStatus === 'cancelled' ? 'Purchase Cancelled'
                : purchaseStatus === 'accepted' ? 'Purchase Accepted'
                : 'Purchase Requested'
              : 'Purchase'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Purchase Price Modal */}
      <Modal visible={showPurchaseModal} transparent animationType="slide" onRequestClose={() => setShowPurchaseModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Purchase</Text>
              <TouchableOpacity onPress={() => setShowPurchaseModal(false)}>
                <Ionicons name="close" size={24} color="#7F8C8D" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              {offer.wasteType} · {qty} {qtyUnit}{'\n'}
              From: {collectorName}
            </Text>

            <Text style={styles.modalLabel}>Your offered price per kg (LKR)</Text>
            <View style={styles.modalInputRow}>
              <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
              <TextInput
                style={styles.modalInput}
                value={pricePerKg}
                onChangeText={setPricePerKg}
                keyboardType="decimal-pad"
                placeholder={`Min: LKR ${offer.minPricePerKg}`}
                placeholderTextColor="#BDC3C7"
                autoFocus
              />
            </View>

            {pricePerKg && parseFloat(pricePerKg) > 0 && (
              <Text style={styles.totalPreview}>
                Total: LKR {(parseFloat(pricePerKg) * (qty || 0)).toFixed(2)}
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPurchaseModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, purchasing && { opacity: 0.7 }]}
                onPress={confirmPurchase}
                disabled={purchasing}
              >
                {purchasing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmBtnText}>Send Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  label: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  value: { fontSize: 14, color: '#7F8C8D', textAlign: 'right', flex: 1, marginLeft: 16 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#2C3E50', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scroll: { flex: 1, backgroundColor: '#F5F6FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  carouselWrap: { height: CAROUSEL_HEIGHT, backgroundColor: '#111', position: 'relative' },
  slide: { width, height: CAROUSEL_HEIGHT },
  slideImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  videoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  pageBadge: { position: 'absolute', bottom: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pageText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  priceBlock: { backgroundColor: '#fff', padding: 20, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  priceText: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F39C12', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  offerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50', marginBottom: 6 },
  descText: { fontSize: 14, color: '#7F8C8D', lineHeight: 21 },
  metaBlock: { backgroundColor: '#fff', marginBottom: 8 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 28,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 10,
  },
  chatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, position: 'relative' },
  chatBtnDisabled: { borderColor: '#E0E0E0' },
  chatBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  chatBtnTextDisabled: { color: '#BDC3C7' },
  lockIcon: { position: 'absolute', top: 6, right: 6 },
  purchaseBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14 },
  purchaseBtnSent: { backgroundColor: '#F39C12' },
  purchaseBtnCancelled: { backgroundColor: '#E74C3C' },
  purchaseBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C3E50' },
  modalSub: { fontSize: 14, color: '#7F8C8D', lineHeight: 20, marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#2C3E50', marginBottom: 8 },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 2, marginBottom: 10 },
  modalInput: { flex: 1, fontSize: 16, color: '#2C3E50', paddingVertical: 12 },
  totalPreview: { fontSize: 16, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#7F8C8D' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
