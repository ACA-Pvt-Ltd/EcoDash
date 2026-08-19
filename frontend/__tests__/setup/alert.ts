import { Alert } from 'react-native';

type AlertButton = { text?: string; style?: string; onPress?: () => void };

/** The arguments of the most recent Alert.alert call. */
export function lastAlert() {
  const calls = (Alert.alert as jest.Mock).mock.calls;
  if (calls.length === 0) throw new Error('No Alert.alert call was made');
  const [title, message, buttons] = calls[calls.length - 1];
  return { title, message, buttons: (buttons ?? []) as AlertButton[] };
}

/** All Alert titles seen so far, for asserting which error the user was shown. */
export function alertTitles(): string[] {
  return (Alert.alert as jest.Mock).mock.calls.map((c) => c[0]);
}

/** Every (title, message) pair, for matching on user-facing copy. */
export function alertMessages(): string[] {
  return (Alert.alert as jest.Mock).mock.calls.map((c) => c[1]).filter(Boolean);
}

/**
 * Simulates the user tapping a button in the most recent Alert.
 * Alerts are the app's only confirmation UI, so most mutations are only
 * reachable through one.
 */
export function pressAlertButton(label: string) {
  const { buttons } = lastAlert();
  const button = buttons.find((b) => b.text === label);
  if (!button) {
    throw new Error(
      `Alert has no button "${label}". Available: ${buttons.map((b) => b.text).join(', ')}`
    );
  }
  button.onPress?.();
}

/** Taps the first non-cancel button — the confirm action. */
export function confirmAlert() {
  const { buttons } = lastAlert();
  const button = buttons.find((b) => b.style !== 'cancel');
  if (!button) throw new Error('Alert has no confirm button');
  button.onPress?.();
}
