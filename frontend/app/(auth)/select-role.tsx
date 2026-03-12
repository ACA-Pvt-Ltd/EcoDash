import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/config';

type Role = 'user' | 'collector' | 'vendor';

interface RoleOption {
  value: Role;
  title: string;
  icon: string;
  description: string;
  color: string;
  features: string[];
}

const roles: RoleOption[] = [
  {
    value: 'user',
    title: 'User',
    icon: '👤',
    description: 'I want to dispose waste and earn rewards',
    color: '#2ECC71',
    features: [
      'Dispose waste at collection points',
      'Earn points for recycling',
      'Redeem rewards from vendors',
      'Track your environmental impact',
    ],
  },
  {
    value: 'collector',
    title: 'Collector',
    icon: '🚛',
    description: 'I collect waste from users',
    color: '#3498DB',
    features: [
      'Scan QR codes to verify users',
      'Record waste collections',
      'Track inventory by waste type',
      'Connect with vendors',
    ],
  },
  {
    value: 'vendor',
    title: 'Vendor',
    icon: '🏭',
    description: 'I buy waste for recycling',
    color: '#9B59B6',
    features: [
      'Browse available waste inventory',
      'Purchase waste from collectors',
      'Set pricing for waste types',
      'Create rewards for users',
    ],
  },
];

export default function SelectRoleScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/(auth)/register?role=${selectedRole}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.icon}>♻️</Text>
        <Text style={styles.title}>Join Our Platform</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>
      </View>

      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={[
              styles.roleCard,
              selectedRole === role.value && {
                borderColor: role.color,
                backgroundColor: `${role.color}10`,
              },
            ]}
            onPress={() => setSelectedRole(role.value)}
            activeOpacity={0.7}
          >
            <View style={styles.roleHeader}>
              <Text style={styles.roleIcon}>{role.icon}</Text>
              <View style={styles.roleHeaderText}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                {selectedRole === role.value && (
                  <View style={[styles.selectedBadge, { backgroundColor: role.color }]}>
                    <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* <Text style={styles.roleDescription}>{role.description}</Text>
            
            <View style={styles.featuresContainer}>
              {role.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={[styles.featureBullet, { color: role.color }]}>•</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View> */}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
            selectedRole && {
              backgroundColor: roles.find(r => r.value === selectedRole)?.color,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedRole}
        >
          <Text style={styles.continueButtonText}>
            Continue as {selectedRole ? roles.find(r => r.value === selectedRole)?.title : '...'}
          </Text>
        </TouchableOpacity>

        <View style={styles.loginPrompt}>
          <Text style={styles.loginPromptText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  roleCard: {
    borderWidth: 2,
    borderColor: COLORS.light,
    borderRadius: 16,
    padding: 20,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  roleHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresContainer: {
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: 20,
    marginRight: 8,
    marginTop: -2,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  continueButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.light,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
