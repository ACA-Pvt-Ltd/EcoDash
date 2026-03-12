import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { ENDPOINTS, COLORS, WASTE_TYPES } from '@/constants/config';

export default function CollectorInventoryScreen() {
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'inOffers' | 'pending' | 'sold'>('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      console.log('📦 Fetching collector inventory...');
      const response: any = await api.get(ENDPOINTS.COLLECTOR_INVENTORY);
      
      console.log('📥 Inventory response:', response);
      
      if (response.success && response.data) {
        // Transform data if needed
        const inventoryData = response.data.inventory || response.data;
        setInventory(inventoryData);
        console.log('✅ Loaded inventory:', inventoryData.length, 'items');
      } else {
        console.log('⚠️ No inventory data available');
        setInventory([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const getTotalWeight = () => {
    return inventory.reduce((sum, item) => sum + item.totalQuantity, 0).toFixed(1);
  };

  const getFilteredInventory = () => {
    if (filter === 'all') return inventory;
    
    return inventory.filter(item => {
      switch(filter) {
        case 'available':
          return item.status.available > 0;
        case 'inOffers':
          return item.status.inOffers > 0;
        case 'pending':
          return item.status.pending > 0;
        case 'sold':
          return item.status.sold > 0;
        default:
          return true;
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'available': return '#4CAF50';
      case 'inOffers': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'sold': return '#9E9E9E';
      default: return COLORS.gray;
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'available': return 'Available';
      case 'inOffers': return 'In Offers';
      case 'pending': return 'Pending';
      case 'sold': return 'Sold';
      default: return status;
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
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>Collected waste ready to sell</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Inventory</Text>
        <Text style={styles.totalValue}>{getTotalWeight()} kg</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'available' && styles.filterTabActive]}
          onPress={() => setFilter('available')}
        >
          <Text style={[styles.filterText, filter === 'available' && styles.filterTextActive]}>
            ✅ Available
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'inOffers' && styles.filterTabActive]}
          onPress={() => setFilter('inOffers')}
        >
          <Text style={[styles.filterText, filter === 'inOffers' && styles.filterTextActive]}>
            📦 In Offers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
            ⏳ Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'sold' && styles.filterTabActive]}
          onPress={() => setFilter('sold')}
        >
          <Text style={[styles.filterText, filter === 'sold' && styles.filterTextActive]}>
            💰 Sold
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.inventoryList}>
        {getFilteredInventory().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Inventory</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'Start scanning users\' QR codes to collect waste!'
                : `No waste ${getStatusLabel(filter).toLowerCase()} yet`
              }
            </Text>
            {filter === 'all' && (
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => router.push('/(collector-tabs)/scan')}
              >
                <Text style={styles.scanButtonText}>📱 Scan QR Code</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          getFilteredInventory().map((item, index) => {
            const wasteInfo = WASTE_TYPES.find(w => w.value === item.wasteType);
            return (
              <View key={index} style={styles.inventoryCard}>
                <View style={styles.inventoryHeader}>
                  <Text style={styles.inventoryIcon}>{wasteInfo?.icon || '♻️'}</Text>
                  <View style={styles.inventoryInfo}>
                    <Text style={styles.inventoryType}>{item.wasteType}</Text>
                    <Text style={styles.inventoryCollections}>
                      {item.transactions} collections • {item.totalPoints} points
                    </Text>
                  </View>
                  <View style={styles.inventoryWeight}>
                    <Text style={styles.inventoryWeightValue}>{item.totalQuantity} kg</Text>
                  </View>
                </View>

                {/* Status Breakdown */}
                <View style={styles.statusContainer}>
                  {item.status.available > 0 && (
                    <View style={styles.statusItem}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor('available') }]} />
                      <Text style={styles.statusText}>
                        {item.status.available} kg available
                      </Text>
                    </View>
                  )}
                  {item.status.inOffers > 0 && (
                    <View style={styles.statusItem}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor('inOffers') }]} />
                      <Text style={styles.statusText}>
                        {item.status.inOffers} kg in offers
                      </Text>
                    </View>
                  )}
                  {item.status.pending > 0 && (
                    <View style={styles.statusItem}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor('pending') }]} />
                      <Text style={styles.statusText}>
                        {item.status.pending} kg pending
                      </Text>
                    </View>
                  )}
                  {item.status.sold > 0 && (
                    <View style={styles.statusItem}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor('sold') }]} />
                      <Text style={styles.statusText}>
                        {item.status.sold} kg sold
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Button */}
                {item.status.available > 0 && (
                  <TouchableOpacity 
                    style={styles.createOfferButton}
                    onPress={() => router.push('/(collector-tabs)/offers')}
                  >
                    <Text style={styles.createOfferButtonText}>Create Offer</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  totalCard: {
    backgroundColor: '#E8F5E9',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 10,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  filterContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  inventoryList: {
    padding: 20,
    paddingTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inventoryIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  inventoryCollections: {
    fontSize: 13,
    color: COLORS.gray,
  },
  inventoryWeight: {
    alignItems: 'flex-end',
  },
  inventoryWeightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: '500',
  },
  createOfferButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  createOfferButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
