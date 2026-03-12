import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { ENDPOINTS, COLORS } from '@/constants/config';

export default function CollectorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      console.log('📊 Fetching collector dashboard...');
      const response: any = await api.get(ENDPOINTS.COLLECTOR_DASHBOARD);
      
      console.log('📥 Dashboard response:', response);
      
      if (response.success && response.data) {
        setStats(response.data);
        console.log('✅ Loaded collector stats');
      } else {
        console.log('⚠️ No stats data available');
        setStats(null);
      }
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'collector') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user, fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Redirect if not a collector
  if (!user && !loading) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user && user.role !== 'collector') {
    return <Redirect href="/" />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}! 🚛</Text>
            <Text style={styles.subtitle}>Collector Dashboard</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(collector-tabs)/profile' as any)}
          >
            <View style={styles.profileImageContainer}>
              <Text style={styles.profileImagePlaceholder}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.quickStats}>
        <View style={[styles.quickStatCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.quickStatValue}>{stats?.today?.transactions || 0}</Text>
          <Text style={styles.quickStatLabel}>Today Collections</Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.quickStatValue}>{stats?.today?.wasteCollected || 0} kg</Text>
          <Text style={styles.quickStatLabel}>Today Weight</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>{stats?.collector?.totalTransactions || 0}</Text>
            <Text style={styles.statLabel}>Total Collections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statValue}>{stats?.thisMonth?.wasteCollected || 0} kg</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>{stats?.collector?.totalWasteCollected || 0} kg</Text>
            <Text style={styles.statLabel}>Total Collected</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>♻️</Text>
            <Text style={styles.statValue}>{stats?.collector?.acceptedWasteTypes?.length || 0}</Text>
            <Text style={styles.statLabel}>Waste Types</Text>
          </View>
        </View>
      </View>

      {stats?.thisMonth?.wasteBreakdown && Object.keys(stats.thisMonth.wasteBreakdown).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month&apos;s Waste Breakdown</Text>
          <View style={styles.wasteBreakdownCard}>
            {Object.entries(stats.thisMonth.wasteBreakdown).map(([type, amount]: [string, any]) => (
              <View key={type} style={styles.wasteBreakdownItem}>
                <View style={styles.wasteBreakdownLeft}>
                  <Text style={styles.wasteBreakdownIcon}>♻️</Text>
                  <Text style={styles.wasteBreakdownType}>{type}</Text>
                </View>
                <Text style={styles.wasteBreakdownAmount}>{amount} kg</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(collector-tabs)/scan' as any)}
        >
          <Text style={styles.actionButtonIcon}>📱</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Scan User QR Code</Text>
            <Text style={styles.actionButtonSubtitle}>Record new waste collection</Text>
          </View>
          <Text style={styles.actionButtonArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(collector-tabs)/inventory' as any)}
        >
          <Text style={styles.actionButtonIcon}>📦</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>View Inventory</Text>
            <Text style={styles.actionButtonSubtitle}>Check collected waste</Text>
          </View>
          <Text style={styles.actionButtonArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(collector-tabs)/vendors' as any)}
        >
          <Text style={styles.actionButtonIcon}>🏭</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>Find Vendors</Text>
            <Text style={styles.actionButtonSubtitle}>Sell your collected waste</Text>
          </View>
          <Text style={styles.actionButtonArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(collector-tabs)/profile' as any)}
        >
          <Text style={styles.actionButtonIcon}>👤</Text>
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonTitle}>My Profile</Text>
            <Text style={styles.actionButtonSubtitle}>View and edit your profile</Text>
          </View>
          <Text style={styles.actionButtonArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileButton: {
    padding: 4,
  },
  profileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileIcon: {
    fontSize: 24,
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileImagePlaceholder: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  greeting: {
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
  quickStats: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  quickStatCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
  },
  actionButtonArrow: {
    fontSize: 28,
    color: COLORS.gray,
  },
  wasteBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wasteBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  wasteBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wasteBreakdownIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  wasteBreakdownType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  wasteBreakdownAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
