import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants/config";
import { StatusBar } from "expo-status-bar";

// Custom Tab Button Component - Memoized for performance
const CustomTabButton = React.memo(({
  iconName,
  label,
  color,
  focused,
}: {
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
  color: string;
  focused: boolean;
}) => {
  return (
    <View style={styles.tabButton}>
      <View
        style={[styles.iconContainer, focused && styles.iconContainerActive]}
      >
        <MaterialIcons name={iconName} size={26} color={color} />
      </View>
      <Text
        style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </View>
  );
});

CustomTabButton.displayName = 'CustomTabButton';

export default function TabLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#9E9E9E",
        headerShown: false,
        // Performance optimizations
        lazy: true, // Lazy load tabs
        freezeOnBlur: true, // Freeze inactive tabs to save memory
        animation: 'shift', // Smooth tab transitions
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === "ios" ? 90 : 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabButton
              iconName="home"
              label="Home"
              color={color}
              focused={focused}
            />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabButton
              iconName="map"
              label="Map"
              color={color}
              focused={focused}
            />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabButton
              iconName="card-giftcard"
              label="Rewards"
              color={color}
              focused={focused}
            />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: "Offers",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabButton
              iconName="local-offer"
              label="Offers"
              color={color}
              focused={focused}
            />
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <CustomTabButton
              iconName="person"
              label="Profile"
              color={color}
              focused={focused}
            />
          ),
          tabBarLabel: () => null,
        }}
      />

      {/* Hidden screens - not shown in tab bar */}
      <Tabs.Screen
        name="create-offer"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="offer-details"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="my-offers"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    flex: 1,
    minWidth: 60,
  },
  iconContainer: {
    width: 50,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  tabLabelActive: {
    fontWeight: "700",
  },
});
