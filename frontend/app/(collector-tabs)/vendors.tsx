import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

export default function VendorsScreen() {
  const router = useRouter();
  const [rawVendors, setRawVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('nearest');

  // Request location once on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationDenied(true); return; }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationDenied(false);
      } catch {
        setLocationDenied(true);
      }
    })();
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const response: any = await api.get(ENDPOINTS.COLLECTOR_VENDORS);
      if (response.success && response.data) {
        setRawVendors(response.data.vendors || response.data);
      } else {
        setRawVendors([]);
      }
    } catch {
      setRawVendors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const onRefresh = () => { setRefreshing(true); fetchVendors(); };

  // Derived list: inject distance, filter, sort
  const displayedVendors = useMemo(() => {
    let list = rawVendors.map(v => {
      const coords = v.location?.coordinates; // [lng, lat]
      const distanceKm =
        userLocation && coords
          ? haversineKm(userLocation.lat, userLocation.lng, coords[1], coords[0])
          : null;
      return { ...v, distanceKm };
    });

    if (radiusFilter !== 'all') {
      list = list.filter(v => inRadiusBand(v.distanceKm, radiusFilter));
    }

    if (sortBy === 'nearest') {
      list.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    } else if (sortBy === 'az') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }

    return list;
  }, [rawVendors, userLocation, radiusFilter, sortBy]);

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(collector-tabs)/' as any)}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Find Vendors</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(collector-tabs)/' as any)}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Find Vendors</Text>
      </View>

      {/* Radius filter */}
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
          <TouchableOpacity key={opt.value} style={styles.sortBtn} onPress={() => setSortBy(opt.value)}>
            <Text style={[styles.sortBtnText, sortBy === opt.value && styles.sortBtnTextActive]}>
              {opt.label}
            </Text>
            {sortBy === opt.value && <View style={styles.sortUnderline} />}
          </TouchableOpacity>
        ))}
        {!userLocation && <Text style={styles.locationHint}>Enable location for distances</Text>}
      </View>

      {locationDenied && (
        <TouchableOpacity style={styles.locationBanner} onPress={() => Linking.openSettings()}>
          <Text style={styles.locationBannerText}>
            📍 Location access needed for distances — tap to enable in Settings
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.vendorsList}>
          {displayedVendors.length > 0 ? (
            displayedVendors.map((vendor, index) => (
              <View key={vendor._id || index} style={styles.vendorCard}>
                <View style={styles.vendorHeader}>
                  <Text style={styles.vendorIcon}>🏭</Text>
                  <View style={styles.vendorInfo}>
                    <Text style={styles.vendorName}>{vendor.name}</Text>
                    {vendor.address && (
                      <Text style={styles.vendorLocation}>
                        📍 {vendor.address.city || vendor.address.street || 'Location not set'}
                      </Text>
                    )}
                    {vendor.isVerified && <Text style={styles.verifiedBadge}>✅ Verified</Text>}
                  </View>
                  {/* Distance badge */}
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>
                      {vendor.distanceKm != null ? `${vendor.distanceKm.toFixed(1)} km` : '—'}
                    </Text>
                  </View>
                </View>

                {/* Rating */}
                {vendor.averageRating > 0 && (
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Text key={s} style={s <= Math.round(vendor.averageRating) ? styles.starFilled : styles.starEmpty}>★</Text>
                    ))}
                    <Text style={styles.ratingText}>{vendor.averageRating.toFixed(1)} ({vendor.ratingCount || 0})</Text>
                  </View>
                )}

                {vendor.description && (
                  <Text style={styles.vendorDescription}>{vendor.description}</Text>
                )}

                {vendor.businessType && (
                  <View style={styles.businessTypeContainer}>
                    <Text style={styles.businessTypeLabel}>Type: </Text>
                    <Text style={styles.businessType}>{vendor.businessType}</Text>
                  </View>
                )}

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{vendor.totalRewards || 0}</Text>
                    <Text style={styles.statLabel}>Rewards</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{vendor.totalRedemptions || 0}</Text>
                    <Text style={styles.statLabel}>Redemptions</Text>
                  </View>
                </View>

                <View style={styles.contactButtons}>
                  {vendor.phone && (
                    <TouchableOpacity style={styles.contactButton} onPress={() => handleCall(vendor.phone)}>
                      <Text style={styles.contactButtonText}>📞 Call</Text>
                    </TouchableOpacity>
                  )}
                  {vendor.website && (
                    <TouchableOpacity
                      style={[styles.contactButton, styles.websiteButton]}
                      onPress={() => Linking.openURL(vendor.website)}
                    >
                      <Text style={styles.contactButtonText}>🌐 Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏭</Text>
              <Text style={styles.emptyText}>No vendors found</Text>
              <Text style={styles.emptySubtext}>
                {radiusFilter !== 'all'
                  ? 'No vendors in this distance range'
                  : 'There are no active vendors yet'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: COLORS.primary,
  },
  backBtn: { padding: 8 },
  navTitle: { flex: 1, fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', marginLeft: 10 },

  // Radius filter
  controlRow: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
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

  vendorsList: { padding: 16 },
  vendorCard: {
    backgroundColor: '#FFFFFF', borderRadius: 15, padding: 20, marginBottom: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  vendorHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  vendorIcon: { fontSize: 36, marginRight: 12 },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 17, fontWeight: 'bold', color: COLORS.dark, marginBottom: 4 },
  vendorLocation: { fontSize: 13, color: COLORS.gray, marginBottom: 2 },
  verifiedBadge: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  distanceBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  distanceText: { fontSize: 11, fontWeight: 'bold', color: COLORS.primary },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 8 },
  starFilled: { fontSize: 14, color: '#F39C12' },
  starEmpty: { fontSize: 14, color: '#ddd' },
  ratingText: { fontSize: 12, color: '#7F8C8D', marginLeft: 4 },
  vendorDescription: { fontSize: 13, color: COLORS.gray, marginBottom: 10, lineHeight: 19 },
  businessTypeContainer: { flexDirection: 'row', marginBottom: 10 },
  businessTypeLabel: { fontSize: 13, color: COLORS.gray },
  businessType: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  statsContainer: {
    flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.gray },
  contactButtons: { flexDirection: 'row', gap: 10 },
  contactButton: {
    flex: 1, backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center',
  },
  websiteButton: { backgroundColor: '#3498DB' },
  contactButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 15 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, textAlign: 'center' },
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
