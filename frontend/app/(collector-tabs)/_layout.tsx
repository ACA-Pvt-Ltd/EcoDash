import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/config';
import { useFirstRunGuide } from '@/hooks/useFirstRunGuide';
import { useTranslation } from '@/context/LanguageContext';

export default function CollectorTabLayout() {
  useFirstRunGuide(); // shows the onboarding guide once per account
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        headerShown: false,
        lazy: true,
        animation: 'shift',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        // Sinhala and Tamil labels are longer: keep them on one line, shrinking if needed
        tabBarLabel: ({ color, children }) => (
          <Text numberOfLines={1} adjustsFontSizeToFit style={{ color, fontSize: 12, fontWeight: '600' }}>
            {children}
          </Text>
        ),
      }}
    >
      {/* Bottom Navigation Tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.collector.dashboard'),
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('tabs.collector.scanQr'),
          tabBarIcon: ({ color }) => <Ionicons name="qr-code" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: t('tabs.collector.myOffers'),
          tabBarIcon: ({ color }) => <Ionicons name="pricetag" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="user-offers"
        options={{
          title: t('tabs.collector.userOffers'),
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="user-requests"
        options={{
          title: t('tabs.collector.myRequests'),
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />

      {/* Hidden screens - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="inventory"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="create-purchase-request"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="user-offer-details"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="my-offer-details"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
