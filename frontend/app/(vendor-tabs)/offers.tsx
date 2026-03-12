import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import api from '@/services/api';
import { ENDPOINTS, COLORS } from '@/constants/config';

export default function VendorOffersScreen() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [pricePerKg, setPricePerKg] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      console.log('🛍️ Fetching waste offers...');
      const response: any = await api.get(ENDPOINTS.VENDOR_OFFERS);
      
      console.log('📥 Offers response:', response);
      
      if (response.success && response.data) {
        // Data now comes from WasteOffer model, not collector inventory
        const offersData = Array.isArray(response.data) ? response.data : [];
        
        // Transform to include collector info
        const transformedOffers = offersData.map((offer: any) => ({
          ...offer,
          collectorId: offer.collector?._id || offer.collector,
          collectorName: offer.collector?.name || 'Unknown Collector',
          quantity: offer.quantity?.value || offer.quantity,
          wasteType: offer.wasteType,
        }));
        
        setOffers(transformedOffers);
        console.log('✅ Loaded offers:', transformedOffers.length, 'offers');
      } else {
        console.log('⚠️ No offers available');
        setOffers([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching offers:', error);
      setOffers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const handlePurchase = (offer: any) => {
    setSelectedOffer(offer);
    setPricePerKg('');
    setModalVisible(true);
  };

  const handleConfirmPurchase = () => {
    const price = parseFloat(pricePerKg);
    if (!price || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price per kg');
      return;
    }
    setModalVisible(false);
    completePurchase(selectedOffer, price);
  };

  const handleCancelPurchase = () => {
    setModalVisible(false);
    setSelectedOffer(null);
    setPricePerKg('');
  };

  const completePurchase = async (offer: any, pricePerKg: number) => {
    try {
      console.log('💰 Purchasing waste...', offer);
      
      const quantity = offer.quantity || offer.weight || 0;
      const totalAmount = quantity * pricePerKg;
      
      // Prepare purchase data
      const purchaseData = {
        offerId: offer._id, // Link to the WasteOffer
        collectorId: offer.collectorId || offer.collector?._id || offer.collector,
        wasteType: offer.wasteType || offer.type || 'Mixed',
        quantity: quantity,
        pricePerUnit: pricePerKg,
        notes: `Purchased from ${offer.collectorName}`,
      };
      
      console.log('📤 Purchase data:', purchaseData);
      
      const response: any = await api.post(ENDPOINTS.VENDOR_PURCHASE, purchaseData);
      
      if (response.success) {
        Alert.alert(
          'Success! ✅',
          `You have successfully purchased:\n\n` +
          `Waste Type: ${purchaseData.wasteType}\n` +
          `Quantity: ${quantity} kg\n` +
          `Price per kg: Rs. ${pricePerKg}\n` +
          `Total: Rs. ${totalAmount.toFixed(2)}\n\n` +
          `From: ${offer.collectorName}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedOffer(null);
                fetchOffers(); // Refresh the list
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Purchase failed');
        setSelectedOffer(null);
      }
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      Alert.alert('Error', error.message || 'Failed to complete purchase');
      setSelectedOffer(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Waste Offers</Text>
        <Text style={styles.subtitle}>Buy waste from collectors</Text>
      </View>

      <View style={styles.offersList}>
        {offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No offers available</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        ) : (
          offers.map((offer, index) => (
            <View key={offer._id || `offer-${index}`} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.collectorName}>
                  {offer.collectorName || 'Unknown Collector'}
                </Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {offer.wasteType || offer.type || 'Mixed'}
                  </Text>
                </View>
              </View>
              <View style={styles.offerDetails}>
                <Text style={styles.offerWeight}>
                  ⚖️ {offer.quantity || offer.weight || 0} kg
                </Text>
                <Text style={styles.offerPrice}>
                  💰 Price on request
                </Text>
              </View>
              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={() => handlePurchase(offer)}
              >
                <Text style={styles.purchaseButtonText}>Purchase</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Purchase Price Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelPurchase}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Purchase Price</Text>
            <Text style={styles.modalSubtitle}>
              {selectedOffer?.wasteType || 'Waste'} · {selectedOffer?.quantity || 0} kg{'\n'}
              From: {selectedOffer?.collectorName || 'Collector'}
            </Text>

            <Text style={styles.inputLabel}>Price per kg (Rs.)</Text>
            <TextInput
              style={styles.priceInput}
              value={pricePerKg}
              onChangeText={setPricePerKg}
              keyboardType="numeric"
              placeholder="e.g. 25"
              placeholderTextColor="#999"
              autoFocus
            />

            {pricePerKg && parseFloat(pricePerKg) > 0 && (
              <Text style={styles.totalPreview}>
                Total: Rs. {(parseFloat(pricePerKg) * (selectedOffer?.quantity || 0)).toFixed(2)}
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelPurchase}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPurchase}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  header: { backgroundColor: COLORS.primary, padding: 20, paddingTop: 60, paddingBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#FFFFFF', opacity: 0.9 },
  offersList: { padding: 20 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: COLORS.gray },
  offerCard: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  collectorName: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, flex: 1 },
  typeBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  typeBadgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  offerDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  offerWeight: { fontSize: 16, color: COLORS.dark },
  offerPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  purchaseButton: { backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  purchaseButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 20, lineHeight: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: 8 },
  priceInput: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, color: COLORS.dark, marginBottom: 12 },
  totalPreview: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.gray, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.gray },
  confirmButton: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center' },
  confirmButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});
