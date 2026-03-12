import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { ENDPOINTS, COLORS } from '@/constants/config';

export default function VendorsScreen() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      console.log('🏭 Fetching vendors...');
      const response: any = await api.get(ENDPOINTS.COLLECTOR_VENDORS);
      
      console.log('📥 Vendors response:', response);
      
      if (response.success && response.data) {
        const vendorsData = response.data.vendors || response.data;
        setVendors(vendorsData);
        console.log('✅ Loaded vendors:', vendorsData.length, 'vendors');
      } else {
        console.log('⚠️ No vendors data available');
        setVendors([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendors();
  };

  const handleContactVendor = (vendor: any) => {
    const location = vendor.address 
      ? `${vendor.address.street || ''}, ${vendor.address.city || ''}, ${vendor.address.state || ''}`.replace(/, ,/g, ',').replace(/^, |, $/g, '')
      : 'Location not available';
    
    Alert.alert(
      vendor.name,
      `📞 Phone: ${vendor.phone}\n📍 Address: ${location}\n🏢 Type: ${vendor.businessType || 'N/A'}\n\nWould you like to call this vendor?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            Alert.alert('Calling', `Dialing ${vendor.phone}...`);
            // In a real app: Linking.openURL(`tel:${vendor.phone}`);
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.backButtonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(collector-tabs)/' as any)}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.backButtonTitle}>Find Vendors</Text>
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
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(collector-tabs)/' as any)}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.backButtonTitle}>Find Vendors</Text>
      </View>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={styles.header}>
       
        <Text style={styles.subtitle}>Sell your collected waste</Text>
      </View>

      <View style={styles.vendorsList}>
        {vendors.length > 0 ? (
          vendors.map((vendor, index) => (
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
                  {vendor.isVerified && (
                    <Text style={styles.verifiedBadge}>✅ Verified</Text>
                  )}
                </View>
              </View>

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
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleContactVendor(vendor)}
                  >
                    <Text style={styles.contactButtonText}>📞 Call</Text>
                  </TouchableOpacity>
                )}
                {vendor.website && (
                  <TouchableOpacity
                    style={[styles.contactButton, styles.websiteButton]}
                    onPress={() => Alert.alert('Website', vendor.website)}
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
              There are no active vendors in your area yet
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
  
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: 8,
  },
  backButtonTitle: {
    flex: 1,
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
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
  vendorsList: {
    padding: 20,
  },
  vendorCard: {
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
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  vendorIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  vendorLocation: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 3,
  },
  verifiedBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  vendorDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
    lineHeight: 20,
  },
  businessTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  businessTypeLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  businessType: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  websiteButton: {
    backgroundColor: '#3498DB',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
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
  },
});
