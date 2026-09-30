import React, { useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { COLORS, ENDPOINTS } from '@/constants/config';

const MIN_LENGTH = 6;

/** Change password for any signed-in role, reached from Profile → Change Password. */
export default function ChangePasswordScreen() {
  const { user, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [loading, setLoading] = useState(false);
  // `loading` alone can't stop two taps in the same frame
  const submittingRef = useRef(false);

  const validate = () => {
    if (!current || !next || !confirm) return 'Please fill in all fields';
    if (next.length < MIN_LENGTH) return `New password must be at least ${MIN_LENGTH} characters`;
    if (next !== confirm) return 'New passwords do not match';
    if (next === current) return 'New password must be different from your current password';
    return null;
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const problem = validate();
    if (problem) {
      Alert.alert('Error', problem);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      await api.put(ENDPOINTS.CHANGE_PASSWORD, { currentPassword: current, newPassword: next });
      Alert.alert('Password changed', 'Use your new password next time you sign in.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not change your password. Please try again.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleForgot = () => {
    Alert.alert(
      'Reset your password?',
      `We'll sign you out and email a reset code to ${user?.email ?? 'your email'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            const email = user?.email ?? '';
            const role = user?.role ?? 'user';
            await logout();
            router.replace({ pathname: '/(auth)/forgot-password', params: { email, role } });
          },
        },
      ]
    );
  };

  const field = (
    key: keyof typeof show,
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    hint?: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show[key]}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
        />
        <TouchableOpacity
          onPress={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
          style={styles.eyeIcon}
          accessibilityLabel={show[key] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          <Ionicons name={show[key] ? 'eye-off' : 'eye'} size={22} color="gray" />
        </TouchableOpacity>
      </View>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Change Password</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Ionicons name="lock-closed" size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.introText}>
              Enter your current password, then choose a new one. You&apos;ll stay signed in on this device.
            </Text>
          </View>

          {field('current', 'Current password', current, setCurrent, 'Enter your current password')}
          {field('next', 'New password', next, setNext, 'Enter a new password', `At least ${MIN_LENGTH} characters`)}
          {field('confirm', 'Confirm new password', confirm, setConfirm, 'Re-enter the new password')}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Change Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgot} style={styles.forgot} hitSlop={8}>
            <Text style={styles.forgotText}>Forgot your current password?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  navTitle: { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  content: { padding: 20 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  introIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.gray },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: COLORS.dark },
  passwordInputContainer: { position: 'relative', width: '100%' },
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
  eyeIcon: { position: 'absolute', right: 15, top: '50%', transform: [{ translateY: -12 }], padding: 5, zIndex: 1 },
  hint: { fontSize: 12, color: COLORS.gray, marginTop: 6 },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
  forgot: { alignSelf: 'center', marginTop: 20, padding: 4 },
  forgotText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
});
