import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { COLORS } from '@/constants/config';
import { useFirstRunGuide } from '@/hooks/useFirstRunGuide';
import { useTranslation } from '@/context/LanguageContext';
import { StatusBar } from 'expo-status-bar';

export default function VendorTabLayout() {
  useFirstRunGuide(); // shows the onboarding guide once per account
  const { t } = useTranslation();

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
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
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.vendor.dashboard'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: t('tabs.vendor.offers'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: t('tabs.vendor.inventory'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="archivebox.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="pricing"
        options={{
          title: t('tabs.vendor.pricing'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="dollarsign.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.vendor.profile'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="offer-details" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="purchases" options={{ href: null }} />
    </Tabs>
    </>
  );
}
