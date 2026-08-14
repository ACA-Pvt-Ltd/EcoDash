import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { COLORS } from '@/constants/config';
import { useAppConfig } from '@/context/AppConfigContext';

/**
 * Support contact details for the login and registration screens — the one
 * place a blocked user cannot reach the in-app help screen, because they
 * cannot get past the door.
 *
 * Details come from AppConfigContext, which fetches the public unauthenticated
 * /config endpoint at startup, so this renders before anyone signs in.
 */
interface Props {
  title?: string;
  message?: string;
}

export default function SupportContactBlock({ title, message }: Props) {
  const { supportContact } = useAppConfig();

  const openLink = async (url: string, failureMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unavailable', failureMessage);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unavailable', failureMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title ?? 'Having trouble signing in?'}</Text>
      <Text style={styles.text}>
        {message ?? 'Check that you selected the right role above. Still stuck? Contact us:'}
      </Text>

      <View style={styles.links}>
        {!!supportContact.email && (
          <TouchableOpacity
            onPress={() =>
              openLink(
                `mailto:${supportContact.email}`,
                `No mail app is set up on this device. Email us at ${supportContact.email}.`
              )
            }
          >
            <Text style={styles.link}>{supportContact.email}</Text>
          </TouchableOpacity>
        )}

        {!!supportContact.phone && (
          <TouchableOpacity
            onPress={() =>
              openLink(
                `tel:${supportContact.phone.replace(/\s/g, '')}`,
                `Calling is not available on this device. Our number is ${supportContact.phone}.`
              )
            }
          >
            <Text style={styles.link}>{supportContact.phone}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!supportContact.hours && <Text style={styles.hours}>{supportContact.hours}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F0F8FF',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    color: COLORS.gray,
  },
  links: {
    marginTop: 8,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    paddingVertical: 3,
  },
  hours: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 6,
  },
});
