import { Alert, Linking } from 'react-native';

/** "+94 77 123-4567" / "(077) 123 4567" → "+94771234567" / "0771234567" for a tel: link. */
export const dialableNumber = (phone: string) => {
  const trimmed = phone.trim();
  return (trimmed.startsWith('+') ? '+' : '') + trimmed.replace(/[^\d]/g, '');
};

/**
 * Opens the phone dialer for `phone`. Explains instead when there's no number,
 * or when the device can't place calls (simulator, tablet, no SIM).
 */
export async function callPhone(phone?: string | null, name?: string) {
  const who = name?.trim() || 'This person';
  if (!phone?.trim() || !dialableNumber(phone).replace('+', '')) {
    Alert.alert('No phone number', `${who} hasn't added a phone number. Try chatting instead.`);
    return;
  }

  const url = `tel:${dialableNumber(phone)}`;
  const fallback = () => Alert.alert('Calling unavailable', `Call ${name?.trim() || 'them'} on ${phone.trim()}.`);
  try {
    if (!(await Linking.canOpenURL(url))) {
      fallback();
      return;
    }
    await Linking.openURL(url);
  } catch {
    fallback();
  }
}
