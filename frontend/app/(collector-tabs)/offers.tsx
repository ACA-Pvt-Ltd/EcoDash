import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';
import { ENDPOINTS, COLORS, WASTE_TYPES } from '@/constants/config';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: '#27AE60', text: '#fff', label: 'Available' },
  reserved:  { bg: '#F39C12', text: '#fff', label: 'Reserved' },
  sold:      { bg: '#2980B9', text: '#fff', label: 'Sold' },
  expired:   { bg: '#95A5A6', text: '#fff', label: 'Expired' },
  cancelled: { bg: '#E74C3C', text: '#fff', label: 'Cancelled' },
};

interface MediaAsset {
  uri: string;
  type: 'image' | 'video';
  name: string;
  mimeType: string;
}

export default function CollectorOffersScreen() {
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [description, setDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'offers' | 'requests'>('offers');
  const [images, setImages] = useState<MediaAsset[]>([]);
  const [video, setVideo] = useState<MediaAsset | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchMyOffers(), fetchPurchaseRequests()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMyOffers = async () => {
    try {
      const response: any = await api.get(ENDPOINTS.COLLECTOR_OFFERS);
      if (response.success) {
        setMyOffers(response.data || []);
      }
    } catch (error) {
      setMyOffers([]);
    }
  };

  const fetchPurchaseRequests = async () => {
    try {
      const response: any = await api.get(ENDPOINTS.COLLECTOR_PURCHASE_REQUESTS);
      if (response.success) {
        setPurchaseRequests(response.data || []);
      }
    } catch (error) {
      setPurchaseRequests([]);
    }
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can add up to 5 photos.');
      return;
    }
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const picked: MediaAsset[] = result.assets.map(a => ({
        uri: a.uri,
        type: 'image',
        name: a.fileName || `photo_${Date.now()}.jpg`,
        mimeType: a.mimeType || 'image/jpeg',
      }));
      setImages(prev => [...prev, ...picked].slice(0, 5));
    }
  };

  const pickVideo = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      videoMaxDuration: 60,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setVideo({
        uri: a.uri,
        type: 'video',
        name: a.fileName || `video_${Date.now()}.mp4`,
        mimeType: a.mimeType || 'video/mp4',
      });
    }
  };

  const handleCreateOffer = async () => {
    if (!selectedWasteType || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('wasteType', selectedWasteType);
      formData.append('quantity', quantity);
      formData.append('minPricePerKg', minPrice || '0');
      if (description) formData.append('description', description);

      images.forEach(img => {
        formData.append('images', {
          uri: img.uri,
          name: img.name,
          type: img.mimeType,
        } as any);
      });

      if (video) {
        formData.append('video', {
          uri: video.uri,
          name: video.name,
          type: video.mimeType,
        } as any);
      }

      const response: any = await api.post(ENDPOINTS.COLLECTOR_CREATE_OFFER, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.success) {
        Alert.alert('Success! ✅', 'Your offer has been created and is now visible to vendors');
        setShowCreateModal(false);
        resetForm();
        fetchMyOffers();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create offer');
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, offeredPrice: number) => {
    Alert.alert(
      'Accept Purchase Request',
      `Accept offer of Rs. ${offeredPrice}/kg?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const response: any = await api.put(
                `${ENDPOINTS.COLLECTOR_PURCHASE_REQUESTS}/${requestId}/accept`
              );
              if (response.success) {
                Alert.alert('Success! ✅', 'Purchase request accepted');
                fetchData();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept request');
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Purchase Request',
      'Are you sure you want to reject this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const response: any = await api.put(
                `${ENDPOINTS.COLLECTOR_PURCHASE_REQUESTS}/${requestId}/reject`
              );
              if (response.success) {
                Alert.alert('Success', 'Purchase request rejected');
                fetchData();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedWasteType('');
    setQuantity('');
    setMinPrice('');
    setDescription('');
    setImages([]);
    setVideo(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderOfferCard = useCallback(({ item: offer }: { item: any }) => {
    const wt = WASTE_TYPES.find(t => t.value === offer.wasteType);
    const hasImage = offer.images && offer.images.length > 0;
    const status = STATUS_COLOR[offer.status] || STATUS_COLOR.available;
    const qty = typeof offer.quantity === 'object'
      ? `${offer.quantity.value} ${offer.quantity.unit}`
      : `${offer.quantity} kg`;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({
          pathname: '/(collector-tabs)/my-offer-details',
          params: { offerId: offer._id },
        } as any)}
      >
        {/* Image area */}
        <View style={styles.imageBox}>
          {hasImage ? (
            <Image source={{ uri: offer.images[0] }} style={styles.cardImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: (wt?.color || '#95A5A6') + '20' }]}>
              <Text style={styles.placeholderEmoji}>{wt?.icon || '♻️'}</Text>
            </View>
          )}
          {offer.video && (
            <View style={styles.playBadge}>
              <Ionicons name="play-circle" size={28} color="#fff" />
            </View>
          )}
          {offer.images && offer.images.length > 1 && (
            <View style={styles.imgCountBadge}>
              <Ionicons name="images-outline" size={11} color="#fff" />
              <Text style={styles.imgCountText}>{offer.images.length}</Text>
            </View>
          )}
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={styles.statusPillText}>{status.label}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{offer.wasteType}</Text>
          <Text style={styles.cardPrice}>LKR {offer.minPricePerKg}/kg</Text>
          <Text style={styles.cardQty}>{qty}</Text>
        </View>

        {/* View details button */}
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => router.push({
            pathname: '/(collector-tabs)/my-offer-details',
            params: { offerId: offer._id },
          } as any)}
        >
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={styles.viewBtnText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, []);

  const renderRequestCard = useCallback(({ item: request }: { item: any }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.vendorName}>
          🏭 {request.vendor?.name || 'Unknown Vendor'}
        </Text>
        <Text style={styles.requestStatus}>⏳ Pending</Text>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.requestItem}>
          Waste Type: <Text style={styles.requestValue}>{request.wasteType}</Text>
        </Text>
        <Text style={styles.requestItem}>
          Quantity: <Text style={styles.requestValue}>{request.quantity?.value || 0} kg</Text>
        </Text>
        <Text style={styles.requestItem}>
          Offered Price: <Text style={styles.requestValue}>Rs. {request.pricePerUnit}/kg</Text>
        </Text>
        <Text style={styles.requestItem}>
          Total: <Text style={styles.requestValue}>Rs. {request.totalAmount}</Text>
        </Text>
        {request.pickupDate && (
          <Text style={styles.requestItem}>
            Pickup: <Text style={styles.requestValue}>
              {new Date(request.pickupDate).toLocaleDateString()}
            </Text>
          </Text>
        )}
      </View>

      {request.notes && (
        <Text style={styles.requestNotes}>Note: {request.notes}</Text>
      )}

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(request._id)}
        >
          <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(request._id, request.pricePerUnit)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), []);

  const pendingRequests = purchaseRequests.filter(r => r.status === 'pending');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Offers</Text>
          <Text style={styles.headerSub}>Manage your waste offers</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>New Offer</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
          onPress={() => setActiveTab('offers')}
        >
          <Text style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>
            My Offers ({myOffers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : activeTab === 'offers' ? (
        <FlatList
          key="offers"
          data={myOffers}
          numColumns={2}
          keyExtractor={(o, i) => o._id || String(i)}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderOfferCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={72} color="#BDC3C7" />
              <Text style={styles.emptyText}>No offers yet</Text>
              <Text style={styles.emptySubtext}>Tap "New Offer" to sell your collected waste</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="requests"
          data={pendingRequests}
          keyExtractor={(r, i) => r._id || String(i)}
          contentContainerStyle={styles.requestListContent}
          renderItem={renderRequestCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-outline" size={72} color="#BDC3C7" />
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubtext}>You&apos;ll see purchase requests from vendors here</Text>
            </View>
          }
        />
      )}

      {/* Create Offer Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => { if (!creating) setShowCreateModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Offer</Text>
              <TouchableOpacity onPress={() => { if (!creating) setShowCreateModal(false); }} disabled={creating}>
                <Ionicons name="close" size={28} color={creating ? '#D0D0D0' : COLORS.gray} />
              </TouchableOpacity>
            </View>

            {/* Creating overlay */}
            {creating && (
              <View style={styles.creatingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.creatingText}>Creating your offer...</Text>
                <Text style={styles.creatingSubText}>Please wait, uploading media</Text>
              </View>
            )}

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Waste Type *</Text>
              <View style={styles.wasteTypeGrid}>
                {WASTE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.wasteTypeButton,
                      selectedWasteType === type.value && styles.wasteTypeButtonSelected,
                    ]}
                    onPress={() => setSelectedWasteType(type.value)}
                  >
                    <Text style={styles.wasteTypeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.wasteTypeLabel,
                      selectedWasteType === type.value && styles.wasteTypeLabelSelected,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Quantity (kg) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <Text style={styles.label}>Minimum Price per kg (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter minimum price"
                keyboardType="numeric"
                value={minPrice}
                onChangeText={setMinPrice}
              />

              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any details..."
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Photos ({images.length}/5)</Text>
              <View style={styles.mediaGrid}>
                {images.map((img, index) => (
                  <View key={index} style={styles.mediaThumbnail}>
                    <Image source={{ uri: img.uri }} style={styles.thumbnailImage} />
                    <TouchableOpacity
                      style={styles.removeMediaBtn}
                      onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close-circle" size={20} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity style={styles.addMediaBtn} onPress={pickImages}>
                    <Ionicons name="camera-outline" size={26} color="#7F8C8D" />
                    <Text style={styles.addMediaText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>Video (1 max · up to 60s)</Text>
              {video ? (
                <View style={styles.videoRow}>
                  <Ionicons name="videocam" size={22} color={COLORS.primary} />
                  <Text style={styles.videoName} numberOfLines={1}>{video.name}</Text>
                  <TouchableOpacity onPress={() => setVideo(null)}>
                    <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addVideoBtn} onPress={pickVideo}>
                  <Ionicons name="videocam-outline" size={26} color="#7F8C8D" />
                  <Text style={styles.addMediaText}>Add Video</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                onPress={handleCreateOffer}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitButtonText}>Create Offer</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: '#95A5A6', fontWeight: '500' },
  activeTabText: { color: COLORS.primary, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  listContent: { padding: 16, backgroundColor: '#F5F6FA' },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  // Offer card
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
  playBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 2,
  },
  imgCountBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  imgCountText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  statusPill: {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#2C3E50', marginBottom: 2 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  cardQty: { fontSize: 11, color: '#7F8C8D' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: COLORS.primary, marginHorizontal: 10, marginBottom: 10,
    paddingVertical: 8, borderRadius: 8,
  },
  viewBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  // Requests list
  requestListContent: { padding: 16, backgroundColor: '#F5F6FA' },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorName: { fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  requestStatus: { fontSize: 12, color: '#F39C12', fontWeight: '600' },
  requestDetails: { marginBottom: 10 },
  requestItem: { fontSize: 14, color: '#7F8C8D', marginBottom: 4 },
  requestValue: { fontWeight: '700', color: '#2C3E50' },
  requestNotes: { fontSize: 13, color: '#7F8C8D', fontStyle: 'italic', marginBottom: 12 },
  requestActions: { flexDirection: 'row', gap: 10 },
  rejectButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E74C3C', padding: 12, borderRadius: 8, gap: 5,
  },
  rejectButtonText: { color: '#fff', fontWeight: '700' },
  acceptButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, gap: 5,
  },
  acceptButtonText: { color: '#fff', fontWeight: '700' },
  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 60 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#2C3E50', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#7F8C8D', textAlign: 'center', marginTop: 6 },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  modalForm: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 8, marginTop: 15 },
  wasteTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  wasteTypeButton: {
    width: '30%', alignItems: 'center', padding: 12, borderRadius: 10,
    borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#fff',
  },
  wasteTypeButtonSelected: { borderColor: COLORS.primary, backgroundColor: '#E8F5E9' },
  wasteTypeIcon: { fontSize: 28, marginBottom: 5 },
  wasteTypeLabel: { fontSize: 11, color: '#7F8C8D', textAlign: 'center' },
  wasteTypeLabelSelected: { color: COLORS.primary, fontWeight: '700' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 12, fontSize: 14, backgroundColor: '#fff',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: COLORS.primary, padding: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 20, marginBottom: 10,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  mediaThumbnail: { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumbnailImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeMediaBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: '#fff', borderRadius: 10 },
  addMediaBtn: {
    width: 72, height: 72, borderRadius: 8, borderWidth: 2, borderColor: '#E0E0E0',
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5',
  },
  addVideoBtn: {
    height: 60, borderRadius: 8, borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#F5F5F5', gap: 8, marginBottom: 4,
  },
  addMediaText: { fontSize: 11, color: '#7F8C8D', fontWeight: '600' },
  videoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.primary, marginBottom: 4,
  },
  videoName: { flex: 1, fontSize: 13, color: '#2C3E50', fontWeight: '500' },
  submitButtonDisabled: { opacity: 0.7 },
  creatingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.92)', zIndex: 10,
    justifyContent: 'center', alignItems: 'center', borderRadius: 20, gap: 12,
  },
  creatingText: { fontSize: 17, fontWeight: '700', color: '#2C3E50' },
  creatingSubText: { fontSize: 13, color: '#7F8C8D' },
});
