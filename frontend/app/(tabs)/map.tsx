import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import * as Location from 'expo-location';
import api from '@/services/api';
import { ENDPOINTS, COLORS } from '@/constants/config';
import { haversineKm, inRadiusBand } from '@/utils/distance';

type RadiusFilter = 'all' | '0-50' | '50-150' | '150-250';
type SortBy = 'nearest' | 'az' | 'rating';

const RADIUS_OPTIONS: { label: string; value: RadiusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: '0–50 km', value: '0-50' },
  { label: '50–150 km', value: '50-150' },
  { label: '150–250 km', value: '150-250' },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
  { label: 'Nearest', value: 'nearest' },
  { label: 'A–Z', value: 'az' },
  { label: 'Top Rated', value: 'rating' },
];

export default function MapScreen() {
  const [rawCollectors, setRawCollectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('nearest');

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
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationDenied(true); return; }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        console.log("User Location:", pos);
        setLocationDenied(false);
      } catch {
        setLocationDenied(true);
      }
    })();
  }, []);

  const fetchCollectors = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedType !== 'all'
        ? `${ENDPOINTS.COLLECTION_POINTS}?wasteType=${selectedType}`
        : ENDPOINTS.COLLECTION_POINTS;

      const response: any = await api.get(url);

      if (response.success && response.data) {
        const formatted = response.data.map((point: any) => ({
          id: point._id,
          name: point.name,
          location: `${point.address?.city || 'Unknown'}, ${point.address?.street || ''}`,
          wasteTypes: point.acceptedWasteTypes || [],
          operatingHours: point.operatingHours
            ? typeof point.operatingHours === 'string'
              ? point.operatingHours
              : Object.entries(point.operatingHours)
                  .map(([day, hours]: [string, any]) =>
                    `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours?.open ?? '—'} - ${hours?.close ?? '—'}`
                  )
                  .join(', ')
            : 'Not specified',
          phone: point.phone || 'Not available',
          coordinates: point.location?.coordinates ?? null, // [lng, lat]
          averageRating: point.averageRating || 0,
          ratingCount: point.ratingCount || 0,
        }));
        setRawCollectors(formatted);
      } else {
        setRawCollectors([]);
      }
    } catch {
      Alert.alert('Error', 'Failed to fetch collection points. Please try again.');
      setRawCollectors([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchCollectors();
  }, [fetchCollectors]);

  // Derived list: inject distance, apply radius filter, sort
  const displayedCollectors = useMemo(() => {
    let list = rawCollectors.map(c => {
      const distanceKm =
        userLocation && c.coordinates
          ? haversineKm(userLocation.lat, userLocation.lng, c.coordinates[1], c.coordinates[0])
          : null;
      return { ...c, distanceKm };
    });

    if (radiusFilter !== 'all') {
      list = list.filter(c => inRadiusBand(c.distanceKm, radiusFilter));
    }

    if (sortBy === 'nearest') {
      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else if (sortBy === 'az') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }

    return list;
  }, [rawCollectors, userLocation, radiusFilter, sortBy]);

  const handleCallCollector = (phone: string) => {
    if (phone && phone !== 'Not available') {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Unavailable', 'Phone number not available for this collector');
    }
  };

  const handleGetDirections = async (collector: any) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get directions');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const { latitude: userLat, longitude: userLng } = pos.coords;
      const lat = collector.coordinates?.[1];
      const lng = collector.coordinates?.[0];
      if (!lat || !lng) { Alert.alert('Error', 'Collector location not available'); return; }
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lng}`;
      if (await Linking.canOpenURL(mapsUrl)) {
        Linking.openURL(mapsUrl);
      } else {
        Alert.alert('Error', 'Maps app not available on this device');
      }
    } catch {
      Alert.alert('Error', 'Failed to open directions');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collection Points</Text>
        <Text style={styles.headerSubtitle}>Find nearby waste collectors</Text>
      </View>

      {/* Waste type chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {wasteTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[styles.filterChip, selectedType === type.value && styles.filterChipActive]}
            onPress={() => setSelectedType(type.value)}
          >
            <Text style={[styles.filterChipText, selectedType === type.value && styles.filterChipTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Radius filter row */}
      <View style={styles.controlRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusScroll}>
          {RADIUS_OPTIONS.map((opt) => {
            const disabled = opt.value !== 'all' && !userLocation;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.radiusPill,
                  radiusFilter === opt.value && styles.radiusPillActive,
                  disabled && styles.radiusPillDisabled,
                ]}
                onPress={() => !disabled && setRadiusFilter(opt.value)}
                activeOpacity={disabled ? 1 : 0.7}
              >
                <Text style={[
                  styles.radiusPillText,
                  radiusFilter === opt.value && styles.radiusPillTextActive,
                  disabled && styles.radiusPillTextDisabled,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort:</Text>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={styles.sortBtn}
            onPress={() => setSortBy(opt.value)}
          >
            <Text style={[styles.sortBtnText, sortBy === opt.value && styles.sortBtnTextActive]}>
              {opt.label}
            </Text>
            {sortBy === opt.value && <View style={styles.sortUnderline} />}
          </TouchableOpacity>
        ))}
        {!userLocation && (
          <Text style={styles.locationHint}>Enable location for distances</Text>
        )}
      </View>

      {locationDenied && (
        <TouchableOpacity style={styles.locationBanner} onPress={() => Linking.openSettings()}>
          <Text style={styles.locationBannerText}>
            📍 Location access needed for distances — tap to enable in Settings
          </Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {displayedCollectors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No collectors found</Text>
              <Text style={styles.emptySubtext}>
                {radiusFilter !== 'all'
                  ? 'No collectors in this distance range'
                  : 'Try selecting a different waste type'}
              </Text>
            </View>
          ) : (
            displayedCollectors.map((collector) => (
              <View key={collector.id} style={styles.collectorCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.collectorName}>{collector.name}</Text>
                    {collector.averageRating > 0 ? (
                      <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Text key={s} style={s <= Math.round(collector.averageRating) ? styles.starFilled : styles.starEmpty}>★</Text>
                        ))}
                        <Text style={styles.ratingText}>
                          {collector.averageRating.toFixed(1)} ({collector.ratingCount})
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noRatingText}>No ratings yet</Text>
                    )}
                    <Text style={styles.collectorLocation}>📍 {collector.location}</Text>
                  </View>
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>
                      {collector.distanceKm != null
                        ? `${collector.distanceKm.toFixed(1)} km`
                        : '—'}
                    </Text>
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
                    onPress={() => handleGetDirections(collector)}
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9, marginTop: 5 },

  // Waste type chips
  filterRow: { paddingVertical: 12, paddingHorizontal: 10, maxHeight: 64, backgroundColor: '#fff' },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#FFFFFF', marginHorizontal: 5,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.dark },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: 'bold' },

  // Radius filter
  controlRow: { backgroundColor: '#fff', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  radiusScroll: { paddingHorizontal: 12, gap: 8 },
  radiusPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  radiusPillActive: { backgroundColor: COLORS.primary },
  radiusPillDisabled: { borderColor: '#DDD' },
  radiusPillText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  radiusPillTextActive: { color: '#fff' },
  radiusPillTextDisabled: { color: '#BBB' },

  // Sort row
  sortRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  sortLabel: { fontSize: 12, fontWeight: '700', color: '#7F8C8D' },
  sortBtn: { alignItems: 'center' },
  sortBtnText: { fontSize: 13, color: '#7F8C8D', fontWeight: '500' },
  sortBtnTextActive: { color: COLORS.primary, fontWeight: '700' },
  sortUnderline: { height: 2, backgroundColor: COLORS.primary, borderRadius: 1, width: '100%', marginTop: 2 },
  locationHint: { fontSize: 10, color: '#BDC3C7', marginLeft: 'auto' as any },

  // List
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  listContainer: { flex: 1, padding: 15 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 15 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: COLORS.gray },

  // Card
  collectorCard: {
    backgroundColor: '#FFFFFF', borderRadius: 15, padding: 20, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  collectorName: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 4 },
  collectorLocation: { fontSize: 13, color: COLORS.gray },
  distanceBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  distanceText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2, marginBottom: 2 },
  starFilled: { fontSize: 14, color: '#F39C12' },
  starEmpty: { fontSize: 14, color: '#ddd' },
  ratingText: { fontSize: 12, color: '#7F8C8D', marginLeft: 4 },
  noRatingText: { fontSize: 11, color: '#BDC3C7', marginTop: 2, marginBottom: 2 },
  wasteTypesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  wasteTypeBadge: {
    backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, marginRight: 8, marginBottom: 8,
  },
  wasteTypeBadgeText: { fontSize: 12, color: COLORS.dark },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIcon: { fontSize: 16, marginRight: 10 },
  infoText: { fontSize: 14, color: COLORS.dark, flex: 1 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 10 },
  actionButtonSecondary: {
    flex: 1, backgroundColor: '#F0F0F0', paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  actionButtonSecondaryText: { color: COLORS.dark, fontWeight: 'bold', fontSize: 14 },
  actionButtonPrimary: {
    flex: 1, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  actionButtonPrimaryText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  locationBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE69C',
  },
  locationBannerText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});
