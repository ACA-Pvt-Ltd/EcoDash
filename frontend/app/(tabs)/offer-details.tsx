import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS } from '@/constants/config';
import { router, useLocalSearchParams } from 'expo-router';

interface PurchaseRequest {
  _id: string;
  collector: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    businessName?: string;
  };
  proposedPrice: number;
  offeredPrice: number;
  proposedPickupTime?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
  respondedAt?: string;
  completedAt?: string;
  finalPayment?: number;
}

interface UserWasteOffer {
  _id: string;
  wasteType: string;
  quantity: {
    value: number;
    unit: string;
  };
  description?: string;
  expectedPrice: number;
  location: {
    address: string;
    city: string;
  };
  status: 'available' | 'pending' | 'sold' | 'cancelled';
  availableFrom: string;
  availableUntil?: string;
  pickupPreference?: string;
  createdAt: string;
}

export default function OfferDetailsScreen() {
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offer, setOffer] = useState<UserWasteOffer | null>(null);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOfferDetails = async () => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.USER_OFFERS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        const foundOffer = data.data?.find((o: UserWasteOffer) => o._id === id);
        if (foundOffer) {
          setOffer(foundOffer);
        } else {
          Alert.alert('Error', 'Offer not found');
          router.back();
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch offer details');
      }
    } catch (error: any) {
      console.error('Error fetching offer details:', error);
      Alert.alert('Error', 'Failed to load offer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseRequests = async () => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.USER_PURCHASE_REQUESTS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      console.log('Purchase requests response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        // Filter requests for this specific offer
        const offerRequests = data.data?.filter((req: any) => {
          const offerId = req.userOffer?._id || req.userOffer;
          return offerId === id;
        }) || [];
        
        console.log('Filtered requests for offer:', id, offerRequests);
        setRequests(offerRequests);
      }
    } catch (error: any) {
      console.error('Error fetching purchase requests:', error);
    }
  };

  useEffect(() => {
    if (id) {
      console.log('Loading offer details for ID:', id);
      fetchOfferDetails();
      fetchPurchaseRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRespondToRequest = async (requestId: string, action: 'accepted' | 'rejected') => {
    Alert.alert(
      action === 'accepted' ? 'Accept Request' : 'Reject Request',
      `Are you sure you want to ${action === 'accepted' ? 'accept' : 'reject'} this purchase request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'accepted' ? 'Accept' : 'Reject',
          style: action === 'accepted' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}${ENDPOINTS.USER_RESPOND_REQUEST(requestId)}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({ status: action }),
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert(
                  'Success', 
                  action === 'accepted' 
                    ? 'Request accepted! The collector will contact you for pickup.' 
                    : 'Request rejected successfully'
                );
                fetchOfferDetails();
                fetchPurchaseRequests();
              } else {
                Alert.alert('Error', data.message || `Failed to ${action === 'accepted' ? 'accept' : 'reject'} request`);
              }
            } catch (error: any) {
              console.error(`Error ${action}ing request:`, error);
              Alert.alert('Error', `Failed to ${action === 'accepted' ? 'accept' : 'reject'} request. Please try again.`);
            }
          },
        },
      ]
    );
  };

  const deleteOffer = async () => {
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
              const response = await fetch(
                `${API_URL}${ENDPOINTS.USER_DELETE_OFFER(id)}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Offer deleted successfully', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              } else {
                Alert.alert('Error', data.message || 'Failed to delete offer');
              }
            } catch (error: any) {
              console.error('Error deleting offer:', error);
              Alert.alert('Error', 'Failed to delete offer. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#2ECC71';
      case 'pending':
        return '#F39C12';
      case 'sold':
        return '#3498DB';
      case 'cancelled':
        return '#95A5A6';
      default:
        return '#7F8C8D';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F39C12';
      case 'accepted':
        return '#2ECC71';
      case 'rejected':
        return '#E74C3C';
      case 'completed':
        return '#3498DB';
      default:
        return '#7F8C8D';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offer Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.loadingText}>Loading offer details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Offer Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>Offer Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer Details</Text>
        {offer.status === 'available' && (
          <TouchableOpacity onPress={deleteOffer}>
            <Ionicons name="trash-outline" size={24} color="#E74C3C" />
          </TouchableOpacity>
        )}
        {offer.status !== 'available' && <View style={{ width: 24 }} />}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status Badge */}
        <View style={styles.section}>
          <View style={[styles.statusBanner, { backgroundColor: getStatusColor(offer.status) }]}>
            <Text style={styles.statusBannerText}>{offer.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Waste Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waste Details</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Ionicons name="trash-bin-outline" size={20} color="#2ECC71" />
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{offer.wasteType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="scale-outline" size={20} color="#2ECC71" />
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>
                {offer.quantity.value} {offer.quantity.unit}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color="#2ECC71" />
              <Text style={styles.detailLabel}>Expected Price:</Text>
              <Text style={styles.detailValue}>LKR {offer.expectedPrice}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {offer.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.card}>
              <Text style={styles.descriptionText}>{offer.description}</Text>
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#2ECC71" />
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{offer.location.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#2ECC71" />
              <Text style={styles.detailLabel}>City:</Text>
              <Text style={styles.detailValue}>{offer.location.city}</Text>
            </View>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#2ECC71" />
              <Text style={styles.detailLabel}>From:</Text>
              <Text style={styles.detailValue}>
                {new Date(offer.availableFrom).toLocaleString()}
              </Text>
            </View>
            {offer.availableUntil && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#2ECC71" />
                <Text style={styles.detailLabel}>Until:</Text>
                <Text style={styles.detailValue}>
                  {new Date(offer.availableUntil).toLocaleString()}
                </Text>
              </View>
            )}
            {offer.pickupPreference && (
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#2ECC71" />
                <Text style={styles.detailLabel}>Preference:</Text>
                <Text style={styles.detailValue}>{offer.pickupPreference}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Purchase Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Purchase Requests ({requests.length})
          </Text>
          {requests.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.noRequestsText}>
                No purchase requests yet. Collectors will see your offer and can send requests.
              </Text>
            </View>
          ) : (
            requests.map((request) => (
              <View key={request._id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View>
                    <Text style={styles.collectorName}>{request.collector?.name || 'Unknown Collector'}</Text>
                    {request.collector?.phone && (
                      <Text style={styles.collectorPhone}>{request.collector.phone}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.requestStatusBadge,
                      { backgroundColor: getRequestStatusColor(request.status) },
                    ]}
                  >
                    <Text style={styles.requestStatusText}>{request.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.requestDetailRow}>
                    <Ionicons name="cash-outline" size={18} color="#7F8C8D" />
                    <Text style={styles.requestDetailLabel}>Offered Price:</Text>
                    <Text style={styles.requestDetailValue}>LKR {request.proposedPrice || request.offeredPrice}</Text>
                  </View>
                  {request.proposedPickupTime && (
                    <View style={styles.requestDetailRow}>
                      <Ionicons name="calendar-outline" size={18} color="#7F8C8D" />
                      <Text style={styles.requestDetailLabel}>Pickup Time:</Text>
                      <Text style={styles.requestDetailValue}>
                        {new Date(request.proposedPickupTime).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {request.status === 'completed' && request.finalPayment && (
                    <View style={styles.requestDetailRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
                      <Text style={styles.requestDetailLabel}>Final Payment:</Text>
                      <Text style={[styles.requestDetailValue, { color: '#2ECC71', fontWeight: 'bold' }]}>
                        LKR {request.finalPayment}
                      </Text>
                    </View>
                  )}
                </View>

                {request.message && (
                  <View style={styles.messageContainer}>
                    <Text style={styles.messageLabel}>Message:</Text>
                    <Text style={styles.messageText}>{request.message}</Text>
                  </View>
                )}

                {request.status === 'pending' && (
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleRespondToRequest(request._id, 'accepted')}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRespondToRequest(request._id, 'rejected')}
                    >
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {request.status === 'accepted' && (
                  <View style={styles.acceptedBanner}>
                    <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.acceptedTitle}>Request Accepted!</Text>
                      <Text style={styles.acceptedText}>
                        Waiting for collector to complete pickup and payment.
                      </Text>
                    </View>
                  </View>
                )}

                {request.status === 'completed' && (
                  <View style={styles.completedBanner}>
                    <Ionicons name="trophy" size={24} color="#F39C12" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.completedTitle}>Transaction Completed!</Text>
                      <Text style={styles.completedText}>
                        You received LKR {request.finalPayment || request.proposedPrice} and earned points!
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  statusBanner: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginLeft: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  noRequestsText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    padding: 20,
    lineHeight: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  collectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  collectorPhone: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  requestStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  requestStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  requestDetails: {
    marginBottom: 12,
  },
  requestDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requestDetailLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  requestDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  messageContainer: {
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  acceptedBanner: {
    flexDirection: 'row',
    backgroundColor: '#D5F4E6',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ECC71',
    marginBottom: 4,
  },
  acceptedText: {
    fontSize: 13,
    color: '#27AE60',
    lineHeight: 18,
  },
  completedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF5E7',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F39C12',
    marginBottom: 4,
  },
  completedText: {
    fontSize: 13,
    color: '#D68910',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
});
