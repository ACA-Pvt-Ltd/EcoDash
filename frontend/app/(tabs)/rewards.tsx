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
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { ENDPOINTS, COLORS } from '@/constants/config';

export default function RewardsScreen() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rewardsRes, redemptionsRes]: any = await Promise.all([
        api.get(ENDPOINTS.REWARDS),
        api.get(ENDPOINTS.REDEMPTIONS),
      ]);

      if (rewardsRes.success && Array.isArray(rewardsRes.data)) {
        setRewards(rewardsRes.data);
      } else {
        setRewards([]);
      }
      
      if (redemptionsRes.success && Array.isArray(redemptionsRes.data)) {
        setRedemptions(redemptionsRes.data);
      } else {
        setRedemptions([]);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewards([]);
      setRedemptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRedeem = async (reward: any) => {
    if ((user?.points || 0) < reward.pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${reward.pointsCost - (user?.points || 0)} more points to redeem this reward.`
      );
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Redeem ${reward.name} for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              const response: any = await api.post(ENDPOINTS.REDEEM_REWARD(reward._id), {
                rewardId: reward._id,
              });

              if (response.success) {
                Alert.alert(
                  'Success!',
                  `You've redeemed ${reward.name}! Your redemption code is: ${response.data.redemptionCode}`
                );
                fetchData();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to redeem reward');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={styles.pointsDisplay}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsValue}>{user?.points || 0}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            Available
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            My Redemptions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'available' ? (
          <View style={styles.rewardsGrid}>
            {!rewards || rewards.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyText}>No rewards available</Text>
                <Text style={styles.emptySubtext}>Check back later for new rewards!</Text>
              </View>
            ) : (
              rewards.map((reward) => {
                const canAfford = (user?.points || 0) >= reward.pointsCost;
                const isAvailable = reward.quantityAvailable > 0;

                return (
                  <View key={reward._id} style={styles.rewardCard}>
                  <View style={styles.rewardIcon}>
                    <Text style={styles.rewardEmoji}>🎁</Text>
                  </View>
                  <Text style={styles.rewardName}>{reward.name}</Text>
                  <Text style={styles.rewardDescription} numberOfLines={2}>
                    {reward.description}
                  </Text>
                  <View style={styles.rewardFooter}>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsBadgeText}>{reward.pointsCost} pts</Text>
                    </View>
                    <Text style={styles.quantityText}>
                      {reward.quantityAvailable} left
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      (!canAfford || !isAvailable) && styles.redeemButtonDisabled,
                    ]}
                    onPress={() => handleRedeem(reward)}
                    disabled={!canAfford || !isAvailable}
                  >
                    <Text
                      style={[
                        styles.redeemButtonText,
                        (!canAfford || !isAvailable) && styles.redeemButtonTextDisabled,
                      ]}
                    >
                      {!isAvailable
                        ? 'Out of Stock'
                        : !canAfford
                        ? 'Not Enough Points'
                        : 'Redeem'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
            )}
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {redemptions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎁</Text>
                <Text style={styles.emptyText}>No redemptions yet</Text>
                <Text style={styles.emptySubtext}>Start earning points to redeem rewards!</Text>
              </View>
            ) : (
              redemptions.map((redemption) => (
                <View key={redemption._id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyRewardName}>{redemption.reward?.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        redemption.status === 'used' && styles.statusBadgeUsed,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {redemption.status === 'used' ? '✓ Used' : '⏳ Pending'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.codeContainer}>
                    <Text style={styles.codeLabel}>Redemption Code:</Text>
                    <Text style={styles.codeValue}>{redemption.redemptionCode}</Text>
                  </View>
                  <Text style={styles.historyDate}>
                    Redeemed on {new Date(redemption.redeemedAt).toLocaleDateString()}
                  </Text>
                  {redemption.usedAt && (
                    <Text style={styles.historyDate}>
                      Used on {new Date(redemption.usedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginRight: 10,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  rewardsGrid: {
    gap: 15,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardIcon: {
    alignItems: 'center',
    marginBottom: 10,
  },
  rewardEmoji: {
    fontSize: 48,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
    textAlign: 'center',
  },
  rewardDescription: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 15,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  quantityText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  redeemButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  redeemButtonTextDisabled: {
    color: COLORS.gray,
  },
  historyContainer: {
    gap: 15,
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
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  historyRewardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeUsed: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  codeContainer: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  codeLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 5,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 5,
  },
});
