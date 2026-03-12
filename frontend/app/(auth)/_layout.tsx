import { Stack } from 'expo-router';
import { COLORS } from '@/constants/config';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        animationDuration: 200,
        contentStyle: { backgroundColor: COLORS.white },
      }}
    >
       <Stack.Screen 
        name="welcome" 
        options={{ 
          title: 'Welcome',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Register',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="select-role" 
        options={{ 
          title: 'Select Role',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
