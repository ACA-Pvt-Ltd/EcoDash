import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import { LanguageProvider } from '@/context/LanguageContext';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

jest.mock('@/context/AppConfigContext', () => ({
  useAppConfig: () => ({ supportContact: { email: 'support@ecodash.lk', phone: '', whatsapp: '', hours: '' } }),
}));

const mockLocale = (locale: string) =>
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    () => ({ resolvedOptions: () => ({ locale }) }) as unknown as Intl.DateTimeFormat
  );

const renderLogin = () => render(<LanguageProvider><LoginScreen /></LanguageProvider>);

describe('Login screen languages', () => {
  afterEach(() => jest.restoreAllMocks());

  it('shows English by default', () => {
    mockLocale('en-US');
    renderLogin();
    expect(screen.getByText('Welcome Back!')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(screen.getByText('Forgot password?')).toBeTruthy();
    expect(screen.getByText('Collector')).toBeTruthy();
  });

  it('switches to Sinhala when සිං is tapped', () => {
    mockLocale('en-US');
    renderLogin();
    fireEvent.press(screen.getByLabelText('සිංහල'));
    expect(screen.getByText('නැවත සාදරයෙන් පිළිගනිමු!')).toBeTruthy();
    expect(screen.getByPlaceholderText('ඔබේ විද්‍යුත් තැපෑල ඇතුළත් කරන්න')).toBeTruthy();
    expect(screen.getByText('එකතුකරන්නා')).toBeTruthy(); // Collector role button
    expect(screen.getAllByText('පිවිසෙන්න').length).toBeGreaterThan(0); // Login button
  });

  it('opens in Tamil on a Tamil phone', () => {
    mockLocale('ta-LK');
    renderLogin();
    expect(screen.getByText('மீண்டும் வருக!')).toBeTruthy();
    expect(screen.getByText('கடவுச்சொல் மறந்துவிட்டதா?')).toBeTruthy();
    expect(screen.getByText('வணிகர்')).toBeTruthy(); // Vendor role button
  });
});
