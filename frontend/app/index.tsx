import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/config';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If not logged in, go to login
  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Redirect based on user role
  if (user.role === 'collector') {
    return <Redirect href="/(collector-tabs)" />;
  } else if (user.role === 'vendor') {
    return <Redirect href="/(vendor-tabs)" />;
  } else {
    return <Redirect href="/(tabs)" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
