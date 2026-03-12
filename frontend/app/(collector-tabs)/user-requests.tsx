import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS, WASTE_TYPES, COLORS } from '@/constants/config';

interface CollectorPurchaseRequest {
  _id: string;
  userOffer: {
    _id: string;
    wasteType: string;
    quantity: {
      value: number;
      unit: string;
    };
    expectedPrice: number;
    location: {
      address: string;
      city: string;
    };
  };
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  offeredPrice: number;
  message?: string;
  proposedPickupTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  userResponse?: string;
  createdAt: string;
  respondedAt?: string;
  completedAt?: string;
}

export default function MyPurchaseRequestsScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<CollectorPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  
  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [offeredAmount, setOfferedAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const url =
        filter === 'all'
          ? `${API_URL}${ENDPOINTS.COLLECTOR_MY_USER_REQUESTS}`
          : `${API_URL}${ENDPOINTS.COLLECTOR_MY_USER_REQUESTS}?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setRequests(data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch requests');
      }
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const completePickup = (requestId: string, offeredPrice: number) => {
    setSelectedRequestId(requestId);
    setOfferedAmount(offeredPrice);
    setPaymentAmount(String(offeredPrice));
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }

    setPaymentModalVisible(false);

    try {
      const response = await fetch(
        `${API_URL}${ENDPOINTS.COLLECTOR_COMPLETE_USER_PICKUP(selectedRequestId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentAmount: amount }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success ✅',
          data.message || `Pickup completed! You paid LKR ${amount}. Waste added to your inventory.`
        );
        fetchRequests();
      } else {
        Alert.alert('Error', data.message || 'Failed to complete pickup');
      }
    } catch (error) {
      console.error('Error completing pickup:', error);
      Alert.alert('Error', 'Failed to complete pickup');
    } finally {
      setPaymentAmount('');
      setSelectedRequestId('');
    }
  };

  const handleCancelPayment = () => {
    setPaymentModalVisible(false);
    setPaymentAmount('');
    setSelectedRequestId('');
  };

  const cancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this purchase request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}${ENDPOINTS.COLLECTOR_CANCEL_USER_REQUEST(requestId)}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Request cancelled successfully');
                fetchRequests();
              } else {
                Alert.alert('Error', data.message || 'Failed to cancel request');
              }
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const getWasteTypeIcon = (wasteType: string) => {
    const type = WASTE_TYPES.find((t) => t.value === wasteType);
    return type?.icon || '♻️';
  };

  const getWasteTypeColor = (wasteType: string) => {
    const type = WASTE_TYPES.find((t) => t.value === wasteType);
    return type?.color || '#95A5A6';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F39C12';
      case 'accepted':
        return '#2ECC71';
      case 'rejected':
        return '#E74C3C';
      case 'completed':
        return '#3498DB';
      case 'cancelled':
        return '#95A5A6';
      default:
        return '#95A5A6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'accepted':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'completed':
        return 'checkmark-done';
      case 'cancelled':
        return 'ban';
      default:
        return 'help-circle';
    }
  };

  const renderRequestCard = (request: CollectorPurchaseRequest) => {
    return (
      <View key={request._id} style={styles.requestCard}>
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(request.status) },
          ]}
        >
          <Ionicons
            name={getStatusIcon(request.status) as any}
            size={14}
            color="#fff"
          />
          <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
        </View>

        {/* Waste Info */}
        <View style={styles.wasteInfo}>
          <Text
            style={[
              styles.wasteIcon,
              { color: getWasteTypeColor(request.userOffer.wasteType) },
            ]}
          >
            {getWasteTypeIcon(request.userOffer.wasteType)}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.wasteType}>{request.userOffer.wasteType}</Text>
            <Text style={styles.quantity}>
              {request.userOffer.quantity.value}{' '}
              {request.userOffer.quantity.unit}
            </Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.userHeader}>
            <Ionicons name="person-circle-outline" size={40} color="#3498DB" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.userName}>{request.user.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#7F8C8D" />
                <Text style={styles.locationText}>
                  {request.userOffer.location.city}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="call-outline" size={14} color="#7F8C8D" />
                <Text style={styles.locationText}>{request.user.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price Info */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>User expected:</Text>
            <Text style={styles.expectedPrice}>
              LKR {request.userOffer.expectedPrice}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Your offer:</Text>
            <Text style={styles.yourOffer}>LKR {request.offeredPrice}</Text>
          </View>
        </View>

        {/* Pickup Time */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#7F8C8D" />
          <Text style={styles.infoText}>
            Pickup: {new Date(request.proposedPickupTime).toLocaleString()}
          </Text>
        </View>

        {/* Your Message */}
        {request.message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>Your message:</Text>
            <Text style={styles.messageText}>{request.message}</Text>
          </View>
        )}

        {/* User Response */}
        {request.userResponse && (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>User&apos;s response:</Text>
            <Text style={styles.responseText}>{request.userResponse}</Text>
          </View>
        )}

        {/* Actions based on status */}
        {request.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => cancelRequest(request._id)}
          >
            <Ionicons name="close-circle" size={20} color="#E74C3C" />
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}

        {request.status === 'accepted' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() =>
                Alert.alert('Contact User', `Call ${request.user.phone}`)
              }
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Contact User</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => completePickup(request._id, request.offeredPrice)}
            >
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.completeButtonText}>Complete Pickup</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completion Info */}
        {request.completedAt && (
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />
            <Text style={styles.completionText}>
              Completed: {new Date(request.completedAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Timestamps */}
        <Text style={styles.timestamp}>
          Sent: {new Date(request.createdAt).toLocaleString()}
        </Text>
        {request.respondedAt && (
          <Text style={styles.timestamp}>
            Responded: {new Date(request.respondedAt).toLocaleString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Purchase Requests</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#ffffffff" />
          </TouchableOpacity>
        </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'pending', 'accepted', 'completed'] as const).map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterTab,
                  filter === status && styles.filterTabActive,
                ]}
                onPress={() => setFilter(status)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === status && styles.filterTabTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {/* Requests List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Purchase Requests</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? "You haven't sent any purchase requests yet."
              : `No ${filter} requests found.`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2ECC71']}
            />
          }
        >
          {requests.map((request) => renderRequestCard(request))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelPayment}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Complete Pickup & Pay User</Text>
            <Text style={styles.modalSubtitle}>
              Enter the amount you are paying to the user
            </Text>
            
            <View style={styles.offerInfo}>
              <Text style={styles.offerLabel}>Your offered price:</Text>
              <Text style={styles.offerValue}>LKR {offeredAmount}</Text>
            </View>

            <Text style={styles.inputLabel}>Payment Amount (LKR)</Text>
            <TextInput
              style={styles.paymentInput}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={handleCancelPayment}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalButton}
                onPress={handleConfirmPayment}
              >
                <Ionicons name="checkmark-done" size={20} color="#fff" />
                <Text style={styles.confirmModalButtonText}>Pay & Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f5f5f5ff',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
  },
  filterTabActive: {
    backgroundColor: '#2ECC71',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  requestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  wasteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 100,
  },
  wasteIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  wasteType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  quantity: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  userSection: {
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  priceSection: {
    backgroundColor: '#FEF5E7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  expectedPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  yourOffer: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#2C3E50',
    flex: 1,
  },
  messageBox: {
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3498DB',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    color: '#2C3E50',
    lineHeight: 18,
  },
  responseBox: {
    backgroundColor: '#D5F4E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#27AE60',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: '#2C3E50',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FADBD8',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#E74C3C',
    fontWeight: '600',
    fontSize: 14,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D5F4E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27AE60',
  },
  timestamp: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 4,
    textAlign: 'right',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7F8C8D',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
  // Payment Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
  },
  offerInfo: {
    backgroundColor: '#FEF5E7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  offerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    backgroundColor: '#F8F9FA',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  cancelModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  confirmModalButton: {
    flex: 1,
    backgroundColor: '#2ECC71',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
