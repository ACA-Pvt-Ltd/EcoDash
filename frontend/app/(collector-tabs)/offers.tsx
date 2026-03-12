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
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { ENDPOINTS, COLORS, WASTE_TYPES } from '@/constants/config';

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
      console.log('📦 Fetching my offers...');
      const response: any = await api.get(ENDPOINTS.COLLECTOR_OFFERS);
      console.log('📦 Offers response:', response);
      
      if (response.success) {
        setMyOffers(response.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching offers:', error);
      setMyOffers([]);
    }
  };

  const fetchPurchaseRequests = async () => {
    try {
      console.log('📥 Fetching purchase requests...');
      const response: any = await api.get(ENDPOINTS.COLLECTOR_PURCHASE_REQUESTS);
      console.log('📥 Requests response:', response);
      
      if (response.success) {
        setPurchaseRequests(response.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching requests:', error);
      setPurchaseRequests([]);
    }
  };

  const handleCreateOffer = async () => {
    if (!selectedWasteType || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const offerData = {
        wasteType: selectedWasteType,
        quantity: parseFloat(quantity),
        minPricePerKg: minPrice ? parseFloat(minPrice) : undefined,
        description: description || undefined,
      };

      console.log('🆕 Creating offer:', offerData);
      const response: any = await api.post(ENDPOINTS.COLLECTOR_CREATE_OFFER, offerData);

      if (response.success) {
        Alert.alert('Success! ✅', 'Your offer has been created and is now visible to vendors');
        setShowCreateModal(false);
        resetForm();
        fetchMyOffers();
      }
    } catch (error: any) {
      console.error('❌ Error creating offer:', error);
      Alert.alert('Error', error.message || 'Failed to create offer');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    Alert.alert(
      'Delete Offer',
      'Are you sure you want to delete this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response: any = await api.delete(`${ENDPOINTS.COLLECTOR_OFFERS}/${offerId}`);
              if (response.success) {
                Alert.alert('Success', 'Offer deleted');
                fetchMyOffers();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete offer');
            }
          },
        },
      ]
    );
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
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Offers & Requests</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Offer</Text>
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
            Requests ({purchaseRequests.filter(r => r.status === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'offers' ? (
          // My Offers Tab
          <View style={styles.offersList}>
            {myOffers.length > 0 ? (
              myOffers.map((offer) => (
                <View key={offer._id} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <View style={styles.offerTypeContainer}>
                      <Text style={styles.offerIcon}>
                        {WASTE_TYPES.find(w => w.value === offer.wasteType)?.icon || '♻️'}
                      </Text>
                      <View>
                        <Text style={styles.offerType}>{offer.wasteType}</Text>
                        <Text style={styles.offerQuantity}>
                          {offer.quantity?.value || offer.quantity} kg
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      offer.status === 'available' && styles.statusAvailable,
                      offer.status === 'sold' && styles.statusSold,
                    ]}>
                      <Text style={styles.statusText}>
                        {offer.status === 'available' ? '🟢 Available' : '✅ Sold'}
                      </Text>
                    </View>
                  </View>

                  {offer.minPricePerKg && (
                    <Text style={styles.offerPrice}>
                      Min Price: Rs. {offer.minPricePerKg}/kg
                    </Text>
                  )}

                  {offer.description && (
                    <Text style={styles.offerDescription}>{offer.description}</Text>
                  )}

                  <Text style={styles.offerDate}>
                    Posted: {new Date(offer.createdAt).toLocaleDateString()}
                  </Text>

                  {offer.status === 'available' && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteOffer(offer._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF5252" />
                      <Text style={styles.deleteButtonText}>Delete Offer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No offers yet</Text>
                <Text style={styles.emptySubtext}>Create an offer to sell your collected waste</Text>
              </View>
            )}
          </View>
        ) : (
          // Purchase Requests Tab
          <View style={styles.requestsList}>
            {purchaseRequests.filter(r => r.status === 'pending').length > 0 ? (
              purchaseRequests
                .filter(r => r.status === 'pending')
                .map((request) => (
                  <View key={request._id} style={styles.requestCard}>
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
                ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📬</Text>
                <Text style={styles.emptyText}>No pending requests</Text>
                <Text style={styles.emptySubtext}>You&apos;ll see purchase requests from vendors here</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Offer Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Offer</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

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

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateOffer}
              >
                <Text style={styles.submitButtonText}>Create Offer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  offersList: {
    padding: 15,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  offerTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  offerType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  offerQuantity: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusAvailable: {
    backgroundColor: '#E8F5E9',
  },
  statusSold: {
    backgroundColor: '#E3F2FD',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  offerPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 5,
  },
  offerDescription: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 5,
  },
  offerDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  deleteButtonText: {
    color: '#FF5252',
    marginLeft: 5,
    fontWeight: '600',
  },
  requestsList: {
    padding: 15,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  requestStatus: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  requestDetails: {
    marginBottom: 10,
  },
  requestItem: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 5,
  },
  requestValue: {
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  requestNotes: {
    fontSize: 13,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5252',
    padding: 12,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  modalForm: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
    marginTop: 15,
  },
  wasteTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  wasteTypeButton: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  wasteTypeButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#E8F5E9',
  },
  wasteTypeIcon: {
    fontSize: 28,
    marginBottom: 5,
  },
  wasteTypeLabel: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'center',
  },
  wasteTypeLabelSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
