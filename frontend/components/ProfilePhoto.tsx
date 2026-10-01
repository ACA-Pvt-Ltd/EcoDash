import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { API_URL, COLORS, ENDPOINTS } from '@/constants/config';

/**
 * Round profile photo for the Profile screens. Shows the person's photo (stored
 * on Cloudinary) or their initial; tapping it takes a new photo, picks one from
 * the library, or removes the current one.
 */
export default function ProfilePhoto({ size = 80, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const { user, token, updateUser } = useAuth();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  // Vendors' /auth/me returns the photo as `logo`
  const photo = user?.profileImage ?? user?.logo ?? null;
  const initial = (user?.name || '?').charAt(0).toUpperCase();

  const fail = (message?: string) => Alert.alert(t('profilePhoto.failedTitle'), message || t('profilePhoto.failed'));

  const request = async (method: 'PUT' | 'DELETE', body?: FormData) => {
    const res = await fetch(`${API_URL}${ENDPOINTS.PROFILE_PHOTO}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message);
    return json.data as { profileImage: string | null };
  };

  const upload = async (asset: ImagePicker.ImagePickerAsset) => {
    const form = new FormData();
    const type = asset.mimeType || 'image/jpeg';
    form.append('photo', {
      uri: asset.uri,
      name: asset.fileName || `profile.${type.split('/')[1] || 'jpg'}`,
      type,
    } as unknown as Blob);
    setBusy(true);
    try {
      const data = await request('PUT', form);
      updateUser({ profileImage: data.profileImage, logo: data.profileImage });
    } catch (error: any) {
      fail(error?.message);
    } finally {
      setBusy(false);
    }
  };

  const pick = async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t(source === 'camera' ? 'profilePhoto.cameraPermissionTitle' : 'profilePhoto.libraryPermissionTitle'),
        t(source === 'camera' ? 'profilePhoto.cameraPermission' : 'profilePhoto.libraryPermission')
      );
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    };
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets?.[0]) await upload(result.assets[0]);
  };

  const remove = async () => {
    setBusy(true);
    try {
      await request('DELETE');
      updateUser({ profileImage: null, logo: null });
    } catch (error: any) {
      fail(error?.message);
    } finally {
      setBusy(false);
    }
  };

  const openMenu = () =>
    Alert.alert(t('profilePhoto.change'), undefined, [
      { text: t('profilePhoto.takePhoto'), onPress: () => pick('camera') },
      { text: t('profilePhoto.chooseFromLibrary'), onPress: () => pick('library') },
      ...(photo ? [{ text: t('profilePhoto.remove'), style: 'destructive' as const, onPress: remove }] : []),
      { text: t('profilePhoto.cancel'), style: 'cancel' as const },
    ]);

  const radius = size / 2;
  return (
    <TouchableOpacity
      onPress={openMenu}
      disabled={busy}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('profilePhoto.change')}
      style={[{ width: size, height: size }, style]}
    >
      <View style={[styles.circle, { width: size, height: size, borderRadius: radius }]}>
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: radius }} testID="profile-photo-image" />
        ) : (
          <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{initial}</Text>
        )}
        {busy && (
          <View style={[styles.overlay, { borderRadius: radius }]}>
            <ActivityIndicator color="#FFFFFF" accessibilityLabel={t('profilePhoto.uploading')} />
          </View>
        )}
      </View>
      <View style={styles.badge}>
        <Ionicons name="camera" size={14} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initial: { fontWeight: 'bold', color: COLORS.primary },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
