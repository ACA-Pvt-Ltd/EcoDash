import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LANGUAGE_STORAGE_KEY,
  LanguageProvider,
  deviceLanguage,
  translate,
  useTranslation,
} from '@/context/LanguageContext';
import { LanguagePills } from '@/components/LanguageSwitcher';

function Probe() {
  const { t, language } = useTranslation();
  return (
    <>
      <Text testID="lang">{language}</Text>
      <Text testID="title">{t('login.welcomeBack')}</Text>
      <Text testID="hello">{t('screens.hello', { name: 'Nimali' })}</Text>
      <LanguagePills />
    </>
  );
}

const mockLocale = (locale: string) =>
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    () => ({ resolvedOptions: () => ({ locale }) }) as unknown as Intl.DateTimeFormat
  );

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('translate', () => {
  it('translates into each language', () => {
    expect(translate('en', 'login.welcomeBack')).toBe('Welcome Back!');
    expect(translate('si', 'login.welcomeBack')).toBe('නැවත සාදරයෙන් පිළිගනිමු!');
    expect(translate('ta', 'login.welcomeBack')).toBe('மீண்டும் வருக!');
  });

  it('fills in {{placeholders}}', () => {
    expect(translate('en', 'screens.hello', { name: 'Nimali' })).toBe('Hello, Nimali');
    expect(translate('ta', 'screens.hello', { name: 'Nimali' })).toBe('வணக்கம், Nimali');
  });

  it('falls back to the key when no language has it', () => {
    expect(translate('si', 'nope.missing')).toBe('nope.missing');
  });
});

describe('deviceLanguage', () => {
  it.each([
    ['si-LK', 'si'],
    ['ta-LK', 'ta'],
    ['ta-IN', 'ta'],
    ['en-US', 'en'],
    ['fr-FR', 'en'],
  ])('%s → %s', (locale, expected) => {
    mockLocale(locale);
    expect(deviceLanguage()).toBe(expected);
  });
});

describe('LanguageProvider', () => {
  it("starts in the phone's language", () => {
    mockLocale('si-LK');
    render(<LanguageProvider><Probe /></LanguageProvider>);
    expect(screen.getByTestId('lang').props.children).toBe('si');
    expect(screen.getByTestId('hello').props.children).toBe('ආයුබෝවන්, Nimali');
  });

  it('switches immediately when a language pill is tapped, and remembers it', async () => {
    mockLocale('en-US');
    render(<LanguageProvider><Probe /></LanguageProvider>);
    expect(screen.getByTestId('title').props.children).toBe('Welcome Back!');

    fireEvent.press(screen.getByLabelText('தமிழ்'));

    expect(screen.getByTestId('title').props.children).toBe('மீண்டும் வருக!');
    await waitFor(async () => expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ta'));
  });

  it("restores the person's saved choice over the phone's language", async () => {
    mockLocale('en-US');
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'si');
    render(<LanguageProvider><Probe /></LanguageProvider>);
    await waitFor(() => expect(screen.getByTestId('lang').props.children).toBe('si'));
  });

  it('ignores a corrupt saved value', async () => {
    mockLocale('en-US');
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    render(<LanguageProvider><Probe /></LanguageProvider>);
    await act(async () => {});
    expect(screen.getByTestId('lang').props.children).toBe('en');
  });
});
