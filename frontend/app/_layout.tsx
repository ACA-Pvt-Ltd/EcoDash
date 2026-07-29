import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import React from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppConfigProvider } from '@/context/AppConfigContext';
import { COLORS } from '@/constants/config';

Sentry.init({
  dsn: 'https://1d5289ddcf5cdea8c85394b5503641d4@o4511554450423808.ingest.de.sentry.io/4511554476048464',
  enabled: !__DEV__,
  debug: false,
  enableAutoSessionTracking: true,
  release: `${Constants.expoConfig?.android?.package ?? 'com.windsun.frontend'}@${Constants.expoConfig?.version ?? '1.0.0'}`,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 0.2,
  integrations: integrations =>
    integrations.filter(i => i.name !== 'UserInteraction' && i.name !== 'TouchEventBoundary'),
  beforeSend(event) {
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 200,
          contentStyle: { backgroundColor: COLORS.white },
          freezeOnBlur: true,
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{
            animation: 'fade',
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: 'fade',
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="(collector-tabs)"
          options={{
            animation: 'fade',
            animationDuration: 200,
          }}
        />
        <Stack.Screen
          name="(vendor-tabs)"
          options={{
            animation: 'fade',
            animationDuration: 200,
          }}
        />
        {/* Shared across all roles — reached from each profile's Help & Support row */}
        <Stack.Screen name="help" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" backgroundColor={COLORS.white} translucent={false} />
    </ThemeProvider>
  );
}

function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppConfigProvider>
          <RootLayoutNav />
        </AppConfigProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
