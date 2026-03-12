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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { API_URL, ENDPOINTS, WASTE_TYPES, COLORS } from '@/constants/config';
import { router } from 'expo-router';

interface UserWasteOffer {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
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
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  status: string;
  availableFrom: string;
  availableUntil?: string;
  pickupPreference?: string;
  createdAt: string;
}

export default function BrowseUserOffersScreen() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<UserWasteOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<UserWasteOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [selectedWasteType, setSelectedWasteType] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [offers, selectedWasteType, citySearch]);

  const fetchOffers = async () => {
    try {
      const response = await fetch(`${API_URL}${ENDPOINTS.COLLECTOR_USER_OFFERS}`, {
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

  const applyFilters = () => {
    let filtered = [...offers];

    if (selectedWasteType) {
      filtered = filtered.filter(offer => offer.wasteType === selectedWasteType);
    }

    if (citySearch.trim()) {
      filtered = filtered.filter(offer =>
        offer.location.city.toLowerCase().includes(citySearch.toLowerCase())
      );
    }

    setFilteredOffers(filtered);
  };

  const clearFilters = () => {
    setSelectedWasteType('');
    setCitySearch('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOffers();
  };

  const getWasteTypeIcon = (wasteType: string) => {
    const type = WASTE_TYPES.find(t => t.value === wasteType);
    return type?.icon || '♻️';
  };

  const getWasteTypeColor = (wasteType: string) => {
    const type = WASTE_TYPES.find(t => t.value === wasteType);
    return type?.color || '#95A5A6';
  };

  const handleCreateRequest = (offer: UserWasteOffer) => {
    router.push({
      pathname: '/(collector-tabs)/create-purchase-request',
      params: { offerId: offer._id }
    } as any);
  };

  const renderOfferCard = (offer: UserWasteOffer) => {
    return (
      <View key={offer._id} style={styles.offerCard}>
        {/* Waste Type Header */}
        <View style={styles.offerHeader}>
          <View style={styles.wasteTypeContainer}>
            <Text style={[styles.wasteIcon, { color: getWasteTypeColor(offer.wasteType) }]}>
              {getWasteTypeIcon(offer.wasteType)}
            </Text>
            <Text style={styles.wasteType}>{offer.wasteType}</Text>
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceLabel}>Expected</Text>
            <Text style={styles.priceText}>LKR {offer.expectedPrice}</Text>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.quantityRow}>
          <Ionicons name="scale-outline" size={18} color="#7F8C8D" />
          <Text style={styles.quantityText}>
            {offer.quantity.value} {offer.quantity.unit}
          </Text>
        </View>

        {/* Description */}
        {offer.description && (
          <Text style={styles.description} numberOfLines={2}>
            {offer.description}
          </Text>
        )}

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.userRow}>
            <Ionicons name="person-circle-outline" size={32} color="#2ECC71" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.userName}>{offer.user.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#7F8C8D" />
                <Text style={styles.locationText}>
                  {offer.location.city} • {offer.location.address.substring(0, 30)}...
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pickup Preference */}
        {offer.pickupPreference && (
          <View style={styles.preferenceBox}>
            <Ionicons name="information-circle-outline" size={16} color="#3498DB" />
            <Text style={styles.preferenceText} numberOfLines={2}>
              {offer.pickupPreference}
            </Text>
          </View>
        )}

        {/* Available Until */}
        {offer.availableUntil && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color="#F39C12" />
            <Text style={styles.timeText}>
              Available until: {new Date(offer.availableUntil).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => handleCreateRequest(offer)}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.requestButtonText}>Request to Buy</Text>
        </TouchableOpacity>

        {/* Posted Time */}
        <Text style={styles.timestamp}>
          Posted: {new Date(offer.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Browse User Offers</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Ionicons
              name={showFilters ? 'close-circle' : 'filter'}
              size={24}
              color="#ffffffff"
            />
          </TouchableOpacity>
        </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersSection}>
          {/* City Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#7F8C8D" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by city..."
              value={citySearch}
              onChangeText={setCitySearch}
            />
            {citySearch !== '' && (
              <TouchableOpacity onPress={() => setCitySearch('')}>
                <Ionicons name="close-circle" size={20} color="#95A5A6" />
              </TouchableOpacity>
            )}
          </View>

          {/* Waste Type Filter */}
          <Text style={styles.filterLabel}>Filter by Waste Type:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.wasteTypeChip,
                !selectedWasteType && styles.wasteTypeChipActive,
              ]}
              onPress={() => setSelectedWasteType('')}
            >
              <Text
                style={[
                  styles.wasteTypeChipText,
                  !selectedWasteType && styles.wasteTypeChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {WASTE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.wasteTypeChip,
                  selectedWasteType === type.value && {
                    backgroundColor: type.color + '30',
                    borderColor: type.color,
                  },
                ]}
                onPress={() => setSelectedWasteType(type.value)}
              >
                <Text style={styles.wasteTypeChipIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.wasteTypeChipText,
                    selectedWasteType === type.value && { color: type.color, fontWeight: 'bold' },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Clear Filters */}
          {(selectedWasteType || citySearch) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'} available
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#2ECC71" />
        </TouchableOpacity>
      </View>

      {/* Offers List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      ) : filteredOffers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="file-tray-outline" size={80} color="#BDC3C7" />
          <Text style={styles.emptyTitle}>No Offers Found</Text>
          <Text style={styles.emptyText}>
            {selectedWasteType || citySearch
              ? 'Try adjusting your filters to see more offers.'
              : 'No user waste offers are currently available.'}
          </Text>
          {(selectedWasteType || citySearch) && (
            <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
              <Text style={styles.emptyButtonText}>Clear Filters</Text>
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
          {filteredOffers.map((offer) => renderOfferCard(offer))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
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
    color: '#ffffffff',
  },
  filtersSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#2C3E50',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  wasteTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  wasteTypeChipActive: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  wasteTypeChipIcon: {
    fontSize: 16,
  },
  wasteTypeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7F8C8D',
  },
  wasteTypeChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E74C3C',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wasteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wasteIcon: {
    fontSize: 28,
  },
  wasteType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  priceBadge: {
    backgroundColor: '#D5F4E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    color: '#27AE60',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  description: {
    fontSize: 13,
    color: '#7F8C8D',
    lineHeight: 18,
    marginBottom: 12,
  },
  userSection: {
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#7F8C8D',
    flex: 1,
  },
  preferenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF5FB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  preferenceText: {
    fontSize: 12,
    color: '#2C3E50',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 11,
    color: '#F39C12',
    fontWeight: '500',
  },
  requestButton: {
    flexDirection: 'row',
    backgroundColor: '#2ECC71',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  requestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
