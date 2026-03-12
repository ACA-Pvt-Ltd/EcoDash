import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { ENDPOINTS, COLORS } from "@/constants/config";
import QRCode from "react-native-qrcode-svg";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response: any = await api.get(ENDPOINTS.LEADERBOARD);
      console.log('📊 Leaderboard response:', response);
      if (response.success && response.data) {
        console.log('✅ Leaderboard data count:', response.data.length);
        console.log('📋 First user:', response.data[0]);
        setLeaderboard(response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const getUserRank = () => {
    const index = leaderboard.findIndex((u) => u._id === user?._id);
    return index >= 0 ? index + 1 : null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const userRank = getUserRank();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        {userRank && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>Rank #{userRank}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.points || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {user?.totalWasteDisposed || 0} kg
          </Text>
          <Text style={styles.statLabel}>Waste Recycled</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.badges?.length || 0}</Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>

      {user?.cashEarned && user.cashEarned > 0 && (
        <View style={styles.cashCard}>
          <Text style={styles.cashIcon}>💵</Text>
          <View style={styles.cashInfo}>
            <Text style={styles.cashLabel}>Total Cash Earned</Text>
            <Text style={styles.cashValue}>LKR {user.cashEarned.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {user?.badges && user.badges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges Earned 🏅</Text>
          <View style={styles.badgesContainer}>
            {user.badges.map((badge: any, index: number) => (
              <View key={index} style={styles.badgeCard}>
                <Text style={styles.badgeIcon}>🏆</Text>
                <Text style={styles.badgeName}>{badge.name || "Badge"}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard 👑</Text>
        <View style={styles.leaderboardCard}>
          {leaderboard && leaderboard.length > 0 ? (
            leaderboard.slice(0, 10).map((leader, index) => {
              const isCurrentUser = leader._id === user?._id;
              return (
                <View
                  key={leader._id || `leader-${index}`}
                  style={[
                    styles.leaderboardItem,
                    isCurrentUser && styles.leaderboardItemHighlight,
                  ]}
                >
                  <View style={styles.leaderboardRank}>
                    {index < 3 ? (
                      <Text style={styles.medalIcon}>
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </Text>
                    ) : (
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text
                      style={[
                        styles.leaderboardName,
                        isCurrentUser && styles.leaderboardNameHighlight,
                      ]}
                    >
                      {leader.name} {isCurrentUser && "(You)"}
                    </Text>
                    <Text style={styles.leaderboardWaste}>
                      {leader.totalWasteDisposed || 0} kg recycled
                    </Text>
                  </View>
                  <Text style={styles.leaderboardPoints}>
                    {leader.points || 0} pts
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No leaderboard data yet</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowQRModal(true)}
        >
          <Text style={styles.menuIcon}>📱</Text>
          <Text style={styles.menuText}>Show My QR Code</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>👤</Text>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>🔔</Text>
          <Text style={styles.menuText}>Notifications</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>My Statistics</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>❓</Text>
          <Text style={styles.menuText}>Help & Support</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuIcon}>ℹ️</Text>
          <Text style={styles.menuText}>About</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>EcoDash v1.0.0</Text>
      </View>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>My QR Code</Text>
            <Text style={styles.modalSubtitle}>
              Scan this code to share your profile
            </Text>

            <View style={styles.qrCodeContainer}>
              {user?._id ? (
                <QRCode
                  value={JSON.stringify({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                  })}
                  size={250}
                  backgroundColor="white"
                  color={COLORS.primary}
                />
              ) : (
                <Text>No QR Code available</Text>
              )}
            </View>

            <View style={styles.userInfoCard}>
              <Text style={styles.userInfoName}>{user?.name}</Text>
              <Text style={styles.userInfoEmail}>{user?.email}</Text>
              <Text style={styles.userInfoRole}>
                {user?.role?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 10,
  },
  rankBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rankText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    margin: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 10,
  },
  cashCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: -10,
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cashIcon: {
    fontSize: 36,
    marginRight: 15,
  },
  cashInfo: {
    flex: 1,
  },
  cashLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  cashValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFB800',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 15,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    width: "31%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 11,
    color: COLORS.dark,
    textAlign: "center",
  },
  leaderboardCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  leaderboardItemHighlight: {
    backgroundColor: "#E8F5E9",
    marginHorizontal: -15,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  leaderboardRank: {
    width: 40,
    alignItems: "center",
  },
  medalIcon: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gray,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 2,
  },
  leaderboardNameHighlight: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  leaderboardWaste: {
    fontSize: 12,
    color: COLORS.gray,
  },
  leaderboardPoints: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
  },
  menuArrow: {
    fontSize: 24,
    color: COLORS.gray,
  },
  logoutButton: {
    backgroundColor: "#FF5252",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalCloseButton: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 20,
    color: COLORS.gray,
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
    marginTop: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 25,
    textAlign: "center",
  },
  qrCodeContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoCard: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  userInfoName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 4,
  },
  userInfoEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  userInfoRole: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
});
