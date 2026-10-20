import React, { useEffect, useRef, useState } from 'react';
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
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth, type User } from '@/context/AuthContext';
import { useAppConfig } from '@/context/AppConfigContext';
import { useTranslation } from '@/context/LanguageContext';
import api from '@/services/api';
import { COLORS, ENDPOINTS } from '@/constants/config';

const BUSINESS_TYPES = [
  { value: 'Physical Store', key: 'editProfile.physicalStore' },
  { value: 'Online', key: 'editProfile.online' },
  { value: 'Both', key: 'editProfile.both' },
];

const ENDPOINT_FOR_ROLE: Record<string, string> = {
  user: ENDPOINTS.UPDATE_PROFILE,
  collector: ENDPOINTS.COLLECTOR_PROFILE,
  vendor: ENDPOINTS.VENDOR_PROFILE,
};

type Form = {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  description: string;
  businessType: string;
  website: string;
  acceptedWasteTypes: string[];
};

const formFrom = (u?: User | null): Form => ({
  name: u?.name ?? '',
  phone: u?.phone ?? '',
  street: u?.address?.street ?? '',
  city: u?.address?.city ?? '',
  state: u?.address?.state ?? '',
  description: u?.description ?? '',
  businessType: u?.businessType ?? 'Physical Store',
  website: u?.website ?? '',
  acceptedWasteTypes: u?.acceptedWasteTypes ?? [],
});

/** The server's message from a failed `api` call, which rejects with the response body or a string. */
const errorMessage = (error: unknown): string | undefined => {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return undefined;
};

/** Edit Profile for users, collectors and vendors, reached from Profile → Edit Profile. */
export default function EditProfileScreen() {
  const { user, updateUser, refreshUser } = useAuth();
  const { wasteCategories } = useAppConfig();
  const { t } = useTranslation();
  const role = user?.role ?? 'user';
  const isCollector = role === 'collector';
  const isVendor = role === 'vendor';

  const [form, setForm] = useState<Form>(() => formFrom(user));
  const [loading, setLoading] = useState(false);
  // `loading` alone can't stop two taps in the same frame
  const submittingRef = useRef(false);
  // Don't overwrite what the person has started typing when fresh details arrive
  const editedRef = useRef(false);

  // The stored sign-in data has no address, so fetch the full profile
  useEffect(() => {
    let active = true;
    refreshUser()
      .then((fresh) => {
        if (active && fresh && !editedRef.current) setForm(formFrom(fresh));
      })
      .catch(() => {});
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    editedRef.current = true;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleWasteType = (value: string) =>
    set(
      'acceptedWasteTypes',
      form.acceptedWasteTypes.includes(value)
        ? form.acceptedWasteTypes.filter((v) => v !== value)
        : [...form.acceptedWasteTypes, value]
    );

  const validate = () => {
    if (!form.name.trim()) return t('editProfile.nameRequired');
    if (!form.phone.trim()) return t('editProfile.phoneRequired');
    if (isCollector && form.acceptedWasteTypes.length === 0) return t('editProfile.wasteTypesRequired');
    return null;
  };

  const buildBody = () => {
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: { street: form.street.trim(), city: form.city.trim(), state: form.state.trim() },
    };
    if (isCollector || isVendor) body.description = form.description.trim();
    if (isCollector) body.acceptedWasteTypes = form.acceptedWasteTypes;
    if (isVendor) {
      body.businessType = form.businessType;
      body.website = form.website.trim();
    }
    return body;
  };

  const handleSave = async () => {
    if (submittingRef.current) return;
    const problem = validate();
    if (problem) {
      Alert.alert(t('editProfile.failedTitle'), problem);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const res: any = await api.put(ENDPOINT_FOR_ROLE[role] ?? ENDPOINTS.UPDATE_PROFILE, buildBody());
      updateUser(res?.data ?? buildBody());
      Alert.alert(t('editProfile.updatedTitle'), t('editProfile.updated'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(t('editProfile.failedTitle'), errorMessage(error) || t('editProfile.failed'));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const field = (key: keyof Form, labelKey: string, placeholderKey: string, props: TextInputProps = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{t(labelKey)}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.multiline]}
        placeholder={t(placeholderKey)}
        placeholderTextColor="#9CA3AF"
        value={form[key] as string}
        onChangeText={(v) => set(key, v)}
        accessibilityLabel={t(labelKey)}
        {...props}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t('editProfile.title')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>{t('editProfile.sectionPersonal')}</Text>
          {field('name', 'editProfile.name', 'editProfile.namePlaceholder', { autoCapitalize: 'words' })}
          {field('phone', 'editProfile.phone', 'editProfile.phonePlaceholder', { keyboardType: 'phone-pad' })}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.email')}</Text>
            <TextInput
              style={[styles.input, styles.readOnly]}
              value={user?.email ?? ''}
              editable={false}
              accessibilityLabel={t('editProfile.email')}
            />
            <Text style={styles.hint}>{t('editProfile.emailHint')}</Text>
          </View>

          <Text style={styles.section}>{t('editProfile.sectionAddress')}</Text>
          {field('street', 'editProfile.street', 'editProfile.streetPlaceholder')}
          {field('city', 'editProfile.city', 'editProfile.cityPlaceholder')}
          {field('state', 'editProfile.state', 'editProfile.statePlaceholder')}

          {(isCollector || isVendor) && (
            <>
              <Text style={styles.section}>{t('editProfile.sectionBusiness')}</Text>

              {isVendor && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('editProfile.businessType')}</Text>
                  <View style={styles.chips}>
                    {BUSINESS_TYPES.map((b) => {
                      const selected = form.businessType === b.value;
                      return (
                        <TouchableOpacity
                          key={b.value}
                          style={[styles.chip, selected && styles.chipSelected]}
                          onPress={() => set('businessType', b.value)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t(b.key)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {isCollector && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t('editProfile.wasteTypes')}</Text>
                  <View style={styles.chips}>
                    {wasteCategories.map((c) => {
                      const selected = form.acceptedWasteTypes.includes(c.value);
                      return (
                        <TouchableOpacity
                          key={c.value}
                          style={[styles.chip, selected && styles.chipSelected]}
                          onPress={() => toggleWasteType(c.value)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                        >
                          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                            {c.icon} {c.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.hint}>{t('editProfile.wasteTypesHint')}</Text>
                </View>
              )}

              {field('description', 'editProfile.description', 'editProfile.descriptionPlaceholder', {
                multiline: true,
                maxLength: 500,
              })}
              {isVendor &&
                field('website', 'editProfile.website', 'editProfile.websitePlaceholder', {
                  autoCapitalize: 'none',
                  autoCorrect: false,
                  keyboardType: 'url',
                })}
            </>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{t('editProfile.save')}</Text>}
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
  content: { padding: 20, paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: COLORS.dark },
  input: {
    borderWidth: 1,
    borderColor: COLORS.light,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#000',
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  readOnly: { color: COLORS.gray, backgroundColor: '#EEF0F2' },
  hint: { fontSize: 12, color: COLORS.gray, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.light,
    backgroundColor: '#F8F9FA',
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, color: COLORS.dark },
  chipTextSelected: { color: COLORS.white, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
});
