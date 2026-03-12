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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS, WASTE_TYPES, COLORS } from '@/constants/config';
import { router } from 'expo-router';

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
  purchaseRequests?: any[];
}

export default function OffersScreen() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<UserWasteOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'pending' | 'sold'>('all');

  useEffect(() => {
    fetchOffers();
  }, [filter]);

  const fetchOffers = async () => {
    try {
      const url = filter === 'all' 
        ? `${API_URL}${ENDPOINTS.USER_OFFERS}`
        : `${API_URL}${ENDPOINTS.USER_OFFERS}?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setOffers(data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch offers');
      }
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      Alert.alert('Error', 'Failed to load offers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const deleteOffer = async (offerId: string) => {
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
                `${API_URL}${ENDPOINTS.USER_DELETE_OFFER(offerId)}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Offer deleted successfully');
                fetchOffers();
              } else {
                Alert.alert('Error', data.message || 'Failed to delete offer');
              }
            } catch (error) {
              console.error('Error deleting offer:', error);
              Alert.alert('Error', 'Failed to delete offer');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#2ECC71';
      case 'pending': return '#F39C12';
      case 'sold': return '#3498DB';
      case 'cancelled': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'sold': return 'checkmark-done';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
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

  const renderOfferCard = (offer: UserWasteOffer) => {
    const requestCount = offer.purchaseRequests?.length || 0;

    return (
      <TouchableOpacity
        key={offer._id}
        style={styles.offerCard}
        onPress={() => router.push(`/(tabs)/offer-details?id=${offer._id}`)}
      >
        {/* Header */}
        <View style={styles.offerHeader}>
          <View style={styles.wasteTypeContainer}>
            <Text style={[styles.wasteIcon, { color: getWasteTypeColor(offer.wasteType) }]}>
              {getWasteTypeIcon(offer.wasteType)}
            </Text>
            <Text style={styles.wasteType}>{offer.wasteType}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(offer.status) }]}>
            <Ionicons name={getStatusIcon(offer.status) as any} size={14} color="#fff" />
            <Text style={styles.statusText}>{offer.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Quantity and Price */}
        <View style={styles.offerDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={18} color="#7F8C8D" />
            <Text style={styles.detailText}>
              {offer.quantity.value} {offer.quantity.unit}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={18} color="#2ECC71" />
            <Text style={styles.priceText}>LKR {offer.expectedPrice}</Text>
          </View>
        </View>

        {/* Description */}
        {offer.description && (
          <Text style={styles.description} numberOfLines={2}>
            {offer.description}
          </Text>
        )}

        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#7F8C8D" />
          <Text style={styles.locationText}>{offer.location.city}</Text>
        </View>

        {/* Purchase Requests Badge */}
        {requestCount > 0 && (
          <View style={styles.requestsBadge}>
            <Ionicons name="mail-outline" size={16} color="#3498DB" />
            <Text style={styles.requestsText}>
              {requestCount} {requestCount === 1 ? 'Request' : 'Requests'}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/(tabs)/offer-details?id=${offer._id}`)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          {offer.status === 'available' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteOffer(offer._id)}
            >
              <Ionicons name="trash-outline" size={20} color="#E74C3C" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Waste Offers</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(tabs)/create-offer')}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Offer</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'available', 'pending', 'sold'] as const).map((status) => (
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

      {/* Offers List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="file-tray-outline" size={80} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Offers Yet</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'Create your first waste offer and start selling to collectors!'
              : `You don't have any ${filter} offers.`}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/create-offer')}
            >
              <Text style={styles.emptyButtonText}>Create Your First Offer</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2ECC71']} />
          }
        >
          {offers.map((offer) => renderOfferCard(offer))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  offerCard: {
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
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wasteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wasteIcon: {
    fontSize: 24,
  },
  wasteType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statusBadge: {
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
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  description: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  requestsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  requestsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498DB',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  deleteButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FADBD8',
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
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomPadding: {
    height: 20,
  },
});
