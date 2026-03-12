import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

type Role = 'user' | 'collector' | 'vendor';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [loading, setLoading] = useState(false);
   const [showPassword, setShowPassword] = useState(false);

  const roles = [
    { value: 'user' as Role, label: 'User', icon: '👤', color: '#2ECC71' },
    { value: 'collector' as Role, label: 'Collector', icon: '🚛', color: '#3498DB' },
    { value: 'vendor' as Role, label: 'Vendor', icon: '🏭', color: '#9B59B6' },
  ];

  const handleLogin = async () => {
    console.log('🚀 handleLogin called');
    console.log('📧 Email input:', email);
    console.log('🔒 Password length:', password.length);
    console.log('👤 Selected role:', role);
    
    if (!email || !password) {
      console.log('⚠️ Validation failed: Missing email or password');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('✅ Validation passed, starting login...');
    setLoading(true);
    try {
      const processedEmail = email.toLowerCase().trim();
      console.log('📧 Processed email:', processedEmail);
      
      await login(processedEmail, password, role);
      
      console.log('✅ Login successful, navigating to role-specific screen...');
      
      // Navigate based on role
      if (role === 'collector') {
        console.log('🚛 Navigating to collector tabs');
        router.replace('/(collector-tabs)');
      } else if (role === 'vendor') {
        console.log('🏭 Navigating to vendor tabs');
        router.replace('/(vendor-tabs)');
      } else {
        console.log('👤 Navigating to user tabs');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.log('❌ Login failed in handleLogin');
      console.log('📝 Error:', error);
      console.log('📝 Error message:', error.message);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      console.log('🏁 Login process finished, setting loading to false');
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.icon}>♻️</Text>
          <Text style={styles.title}>EcoDash</Text>
          <Text style={styles.subtitle}>Make Earth Green Again</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>

          {/* Role Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Login as</Text>
            <View style={styles.roleSelector}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleButton,
                    role === r.value && { 
                      backgroundColor: r.color,
                      borderColor: r.color 
                    },
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text style={styles.roleIcon}>{r.icon}</Text>
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === r.value && styles.roleButtonTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={24} 
                  color="gray" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.button, 
              { backgroundColor: roles.find(r => r.value === role)?.color || COLORS.primary },
              loading && styles.buttonDisabled
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/select-role')}>
              <Text style={[styles.linkText, { color: roles.find(r => r.value === role)?.color }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
  },
  form: {
    width: '100%',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: COLORS.dark,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.dark,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.light,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  roleButtonTextActive: {
    color: COLORS.white,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#000',
  },
  passwordInputContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 10,
    padding: 15,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#000',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: 5,
    zIndex: 1,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  demoText: {
    fontSize: 12,
    color: COLORS.gray,
  },
});
