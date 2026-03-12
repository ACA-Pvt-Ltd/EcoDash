import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, WASTE_TYPES, ENDPOINTS } from '@/constants/config';
import api from '@/services/api';

export default function VendorInventoryScreen() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = useCallback(async () => {
    try {
      console.log('📦 Fetching vendor inventory...');
      const response: any = await api.get(ENDPOINTS.VENDOR_INVENTORY);
      console.log('📦📥 Vendor inventory response:', response);
      
      if (response.success) {
        // Backend returns { purchases, summary } — summary is the grouped inventory by waste type
        const summaryData = response.data?.summary || response.data?.inventory || response.data || [];
        setInventory(Array.isArray(summaryData) ? summaryData : []);
        console.log('📦✅ Vendor inventory loaded:', summaryData);
      }
    } catch (error) {
      console.error('📦❌ Error fetching vendor inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, [fetchInventory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const getTotalWeight = () => {
    if (!Array.isArray(inventory) || inventory.length === 0) {
      return '0.0';
    }
    return inventory.reduce((sum, item) => sum + (item.totalQuantity || item.weight || 0), 0).toFixed(1);
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

      <View style={styles.inventoryList}>
        {Array.isArray(inventory) && inventory.length > 0 ? (
          inventory.map((item, index) => {
            const wasteType = item.wasteType || item.type;
            const wasteInfo = WASTE_TYPES.find(w => w.value === wasteType);
            const weight = item.totalQuantity || item.weight || 0;
            const collections = item.purchases || item.collections || item.transactions || 0;
            
            return (
              <View key={index} style={styles.inventoryCard}>
                <Text style={styles.inventoryIcon}>{wasteInfo?.icon || '♻️'}</Text>
                <View style={styles.inventoryInfo}>
                  <Text style={styles.inventoryType}>{wasteType}</Text>
                  <Text style={styles.inventoryCollections}>
                    {collections} {collections === 1 ? 'collection' : 'collections'}
                  </Text>
                </View>
                <View style={styles.inventoryWeight}>
                  <Text style={styles.inventoryWeightValue}>{weight} kg</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No inventory yet</Text>
            <Text style={styles.emptySubtext}>Start collecting waste to build your inventory</Text>
          </View>
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
  inventoryList: {
    padding: 20,
    paddingTop: 0,
  },
  inventoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    paddingHorizontal: 20,
  },
});
