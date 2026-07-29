import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, type FaqItem } from '@/constants/config';
import { useAppConfig } from '@/context/AppConfigContext';
import { useAuth } from '@/context/AuthContext';

/**
 * Shared help screen for all three roles. Content is admin-managed and arrives
 * through AppConfigContext, so copy changes ship without an app release.
 */
export default function HelpScreen() {
  const { faqItems, supportContact } = useAppConfig();
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const role = user?.role ?? 'user';

  const visibleFaqs = useMemo(
    () => faqItems.filter((item: FaqItem) => item.role === 'all' || item.role === role),
    [faqItems, role]
  );

  const openLink = async (url: string, failureMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unavailable', failureMessage);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unavailable', failureMessage);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Frequently asked questions</Text>

        {visibleFaqs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No questions have been published yet. You can still reach us using the
              contact details below.
            </Text>
          </View>
        ) : (
          visibleFaqs.map((item) => {
            const isOpen = expandedId === item.id;
            return (
              <View key={item.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => setExpandedId(isOpen ? null : item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.gray}
                  />
                </TouchableOpacity>
                {isOpen && <Text style={styles.faqAnswer}>{item.answer}</Text>}
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, styles.contactHeading]}>Still need help?</Text>
        <View style={styles.contactCard}>
          <Text style={styles.contactIntro}>
            Having trouble signing in, registering, or with anything else? Get in touch
            and we will help you out.
          </Text>

          {!!supportContact.email && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() =>
                openLink(
                  `mailto:${supportContact.email}`,
                  `No mail app is set up on this device. Email us at ${supportContact.email}.`
                )
              }
            >
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>{supportContact.email}</Text>
            </TouchableOpacity>
          )}

          {!!supportContact.phone && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() =>
                openLink(
                  `tel:${supportContact.phone.replace(/\s/g, '')}`,
                  `Calling is not available on this device. Our number is ${supportContact.phone}.`
                )
              }
            >
              <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>{supportContact.phone}</Text>
            </TouchableOpacity>
          )}

          {!!supportContact.whatsapp && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() =>
                openLink(
                  `https://wa.me/${supportContact.whatsapp!.replace(/[^0-9]/g, '')}`,
                  `WhatsApp is not installed. Our number is ${supportContact.whatsapp}.`
                )
              }
            >
              <Ionicons name="logo-whatsapp" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>{supportContact.whatsapp}</Text>
            </TouchableOpacity>
          )}

          {!!supportContact.hours && (
            <View style={styles.contactRow}>
              <Ionicons name="time-outline" size={20} color={COLORS.gray} />
              <Text style={[styles.contactText, styles.contactHours]}>
                {supportContact.hours}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.versionText}>EcoDash v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  contactHeading: {
    marginTop: 28,
  },
  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.gray,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 18,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.gray,
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 18,
  },
  contactIntro: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.gray,
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactText: {
    fontSize: 15,
    color: COLORS.dark,
    marginLeft: 12,
    flex: 1,
  },
  contactHours: {
    color: COLORS.gray,
    fontSize: 13,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 24,
  },
});
