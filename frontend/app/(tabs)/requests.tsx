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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS, WASTE_TYPES, COLORS } from '@/constants/config';

interface PurchaseRequest {
  _id: string;
  userOffer: {
    _id: string;
    wasteType: string;
    quantity: {
      value: number;
      unit: string;
    };
    expectedPrice: number;
  };
  collector: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  offeredPrice: number;
  message?: string;
  proposedPickupTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  userResponse?: string;
  createdAt: string;
}

export default function PurchaseRequestsScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('pending');
  
  // Response modal state
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.USER_PURCHASE_REQUESTS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch purchase requests');
      }
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load purchase requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const openResponseModal = (request: PurchaseRequest, isAccept: boolean) => {
    setSelectedRequest(request);
    setResponseMessage('');
    Alert.alert(
      isAccept ? 'Accept Request' : 'Reject Request',
      isAccept
        ? `Accept ${request.collector.name}'s offer of LKR ${request.offeredPrice}?`
        : `Reject this purchase request from ${request.collector.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isAccept ? 'Accept' : 'Reject',
          style: isAccept ? 'default' : 'destructive',
          onPress: () => {
            setShowResponseModal(true);
          },
        },
      ]
    );
  };

  const handleResponse = async (accept: boolean) => {
    if (!selectedRequest) return;

    setResponding(true);

    try {
      const response = await fetch(
        `${API_URL}${ENDPOINTS.USER_RESPOND_REQUEST(selectedRequest._id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            response: accept ? 'accept' : 'reject',
            message: responseMessage.trim(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowResponseModal(false);
        Alert.alert(
          'Success',
          accept
            ? 'Request accepted! The collector will contact you for pickup.'
            : 'Request rejected successfully.'
        );
        fetchRequests();
      } else {
        Alert.alert('Error', data.message || 'Failed to respond to request');
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      Alert.alert('Error', 'Failed to respond. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const getWasteTypeIcon = (wasteType: string) => {
    const type = WASTE_TYPES.find(t => t.value === wasteType);
    return type?.icon || '♻️';
  };

  const getWasteTypeColor = (wasteType: string) => {
    const type = WASTE_TYPES.find(t => t.value === wasteType);
    return type?.color || '#95A5A6';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F39C12';
      case 'accepted': return '#2ECC71';
      case 'rejected': return '#E74C3C';
      case 'completed': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const renderRequestCard = (request: PurchaseRequest) => {
    return (
      <View key={request._id} style={styles.requestCard}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
        </View>

        {/* Waste Info */}
        <View style={styles.wasteInfo}>
          <Text style={[styles.wasteIcon, { color: getWasteTypeColor(request.userOffer.wasteType) }]}>
            {getWasteTypeIcon(request.userOffer.wasteType)}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.wasteType}>{request.userOffer.wasteType}</Text>
            <Text style={styles.quantity}>
              {request.userOffer.quantity.value} {request.userOffer.quantity.unit}
            </Text>
          </View>
        </View>

        {/* Collector Info */}
        <View style={styles.collectorSection}>
          <View style={styles.collectorHeader}>
            <Ionicons name="person-circle-outline" size={40} color="#2ECC71" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.collectorName}>{request.collector.name}</Text>
              <Text style={styles.collectorContact}>{request.collector.phone}</Text>
            </View>
          </View>
        </View>

        {/* Price Comparison */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Your asking price:</Text>
            <Text style={styles.yourPrice}>LKR {request.userOffer.expectedPrice}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Collector's offer:</Text>
            <Text style={[
              styles.offeredPrice,
              request.offeredPrice >= request.userOffer.expectedPrice
                ? { color: '#2ECC71' }
                : { color: '#E74C3C' }
            ]}>
              LKR {request.offeredPrice}
            </Text>
          </View>
          {request.offeredPrice >= request.userOffer.expectedPrice && (
            <View style={styles.goodDealBadge}>
              <Ionicons name="trending-up" size={16} color="#2ECC71" />
              <Text style={styles.goodDealText}>Good offer!</Text>
            </View>
          )}
        </View>

        {/* Pickup Time */}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#7F8C8D" />
          <Text style={styles.infoText}>
            Proposed Pickup: {new Date(request.proposedPickupTime).toLocaleString()}
          </Text>
        </View>

        {/* Message */}
        {request.message && (
          <View style={styles.messageBox}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color="#3498DB" />
            <Text style={styles.messageText}>{request.message}</Text>
          </View>
        )}

        {/* User Response */}
        {request.userResponse && (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>Your response:</Text>
            <Text style={styles.responseText}>{request.userResponse}</Text>
          </View>
        )}

        {/* Action Buttons */}
        {request.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => openResponseModal(request, true)}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => openResponseModal(request, false)}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Button for Accepted */}
        {request.status === 'accepted' && (
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Contact Collector</Text>
          </TouchableOpacity>
        )}

        {/* Created Time */}
        <Text style={styles.timestamp}>
          Received: {new Date(request.createdAt).toLocaleString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Purchase Requests</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['pending', 'accepted', 'all'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterTab, filter === status && styles.filterTabActive]}
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
          ))}
        </ScrollView>
      </View>

      {/* Requests List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-open-outline" size={80} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Purchase Requests</Text>
          <Text style={styles.emptyText}>
            {filter === 'pending'
              ? 'No pending requests at the moment.'
              : filter === 'accepted'
              ? "You haven't accepted any requests yet."
              : 'You have no purchase requests.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2ECC71']} />
          }
        >
          {filteredRequests.map((request) => renderRequestCard(request))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a message (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your message to the collector..."
              value={responseMessage}
              onChangeText={setResponseMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowResponseModal(false)}
                disabled={responding}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => handleResponse(selectedRequest?.status === 'pending')}
                disabled={responding}
              >
                {responding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    paddingHorizontal: 12,
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
    paddingRight: 80,
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
  collectorSection: {
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  collectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  collectorContact: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
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
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  yourPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  offeredPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goodDealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  goodDealText: {
    fontSize: 12,
    fontWeight: '600',
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
    flexDirection: 'row',
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  messageText: {
    fontSize: 13,
    color: '#2C3E50',
    flex: 1,
    lineHeight: 18,
  },
  responseBox: {
    backgroundColor: '#D5F4E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27AE60',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: '#2C3E50',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#2ECC71',
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  contactButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  timestamp: {
    fontSize: 11,
    color: '#95A5A6',
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2C3E50',
    height: 100,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#2C3E50',
    fontWeight: '600',
    fontSize: 14,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2ECC71',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
