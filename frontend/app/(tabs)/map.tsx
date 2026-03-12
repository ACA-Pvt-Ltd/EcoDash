import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import api from '@/services/api';
import { ENDPOINTS, COLORS } from '@/constants/config';

export default function MapScreen() {
  const [collectors, setCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const wasteTypes = [
    { label: 'All', value: 'all' },
    { label: '♻️ E-waste', value: 'E-waste' },
    { label: '🧴 Plastic', value: 'Plastic' },
    { label: '🛍️ Polythene', value: 'Polythene' },
    { label: '🔩 Metal', value: 'Metal' },
    { label: '🪟 Glass', value: 'Glass' },
    { label: '📄 Paper', value: 'Paper' },
    { label: '🌿 Organic', value: 'Organic' },
  ];

  useEffect(() => {
    fetchCollectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  const fetchCollectors = async () => {
    setLoading(true);
    try {
      console.log('🗺️ Fetching collection points...');

      // Fetch all collectors — no location filter
      const url = selectedType !== 'all'
        ? `${ENDPOINTS.COLLECTION_POINTS}?wasteType=${selectedType}`
        : ENDPOINTS.COLLECTION_POINTS;

      const response: any = await api.get(url);
      
      console.log('📥 Collection points response:', response);
      
      if (response.success && response.data) {
        const collectionPoints = response.data;
        
        // Transform data to match component structure
        const formattedCollectors = collectionPoints.map((point: any) => ({
          id: point._id,
          name: point.name,
          location: `${point.address?.city || 'Unknown'}, ${point.address?.street || ''}`,
          wasteTypes: point.acceptedWasteTypes || [],
          operatingHours: typeof point.operatingHours === 'string'
            ? point.operatingHours
            : point.operatingHours
              ? Object.entries(point.operatingHours)
                  .map(([day, hours]: [string, any]) =>
                    `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours?.open ?? '—'} - ${hours?.close ?? '—'}`
                  )
                  .join(', ')
              : 'Not specified',
          phone: point.phone || 'Not available',
          distance: point.distance ? `${point.distance.toFixed(1)} km` : '—',
          coordinates: point.location?.coordinates,
        }));
        
        setCollectors(formattedCollectors);
        console.log('✅ Loaded', formattedCollectors.length, 'collection points');
      } else {
        console.log('⚠️ No collection points found');
        setCollectors([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching collectors:', error);
      Alert.alert('Error', 'Failed to fetch collection points. Please try again.');
      setCollectors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCallCollector = (phone: string) => {
    if (phone && phone !== 'Not available') {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Unavailable', 'Phone number not available for this collector');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collection Points</Text>
        <Text style={styles.headerSubtitle}>Find nearby waste collectors</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {wasteTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.filterChip,
              selectedType === type.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedType(type.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedType === type.value && styles.filterChipTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {collectors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No collectors found</Text>
              <Text style={styles.emptySubtext}>Try selecting a different waste type</Text>
            </View>
          ) : (
            collectors.map((collector) => (
              <View key={collector.id} style={styles.collectorCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.collectorName}>{collector.name}</Text>
                    <Text style={styles.collectorLocation}>📍 {collector.location}</Text>
                  </View>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>{collector.distance}</Text>
                  </View>
                </View>

                <View style={styles.wasteTypesContainer}>
                  {collector.wasteTypes.map((type: string) => (
                    <View key={type} style={styles.wasteTypeBadge}>
                      <Text style={styles.wasteTypeBadgeText}>{type}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>⏰</Text>
                  <Text style={styles.infoText}>{collector.operatingHours}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📞</Text>
                  <Text style={styles.infoText}>{collector.phone}</Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButtonSecondary}
                    onPress={() => Alert.alert('Directions', 'Opening maps...')}
                  >
                    <Text style={styles.actionButtonSecondaryText}>Get Directions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButtonPrimary}
                    onPress={() => handleCallCollector(collector.phone)}
                  >
                    <Text style={styles.actionButtonPrimaryText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 5,
  },
  filterContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    maxHeight: 70,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
  },
  collectorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  collectorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  collectorLocation: {
    fontSize: 14,
    color: COLORS.gray,
  },
  distanceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  wasteTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  wasteTypeBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  wasteTypeBadgeText: {
    fontSize: 12,
    color: COLORS.dark,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
