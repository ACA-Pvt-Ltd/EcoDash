import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import ProfileScreen from '@/app/(tabs)/profile';

let mockUser: Record<string, any> = {};
const mockRefreshUser = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: jest.fn(), refreshUser: mockRefreshUser }),
}));

jest.mock('@/components/ProfilePhoto', () => () => null);

jest.mock('@/components/LanguageSwitcher', () => ({
  useLanguagePicker: () => jest.fn(),
  useCurrentLanguageName: () => 'English',
}));

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ success: true, data: [] })) },
}));

const NIMALI = { _id: 'u1', role: 'user', name: 'Nimali Perera', email: 'nimali@test.dev', points: 80, qrCode: 'data:qr' };

describe('User profile screen', () => {
  beforeEach(() => mockRefreshUser.mockResolvedValue(undefined));

  it('loads the full account when shown, since sign-in data has no cash total', async () => {
    mockUser = NIMALI;
    render(<ProfileScreen />);
    await waitFor(() => expect(mockRefreshUser).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Total Cash Earned')).toBeNull();
  });

  it('shows total cash earned once the account has it', async () => {
    mockUser = { ...NIMALI, cashEarned: 2380 };
    render(<ProfileScreen />);
    await act(async () => {});
    expect(screen.getByText('Total Cash Earned')).toBeTruthy();
    expect(screen.getByText('LKR 2380.00')).toBeTruthy();
  });

  it('hides the cash card when nothing has been earned', async () => {
    mockUser = { ...NIMALI, cashEarned: 0 };
    render(<ProfileScreen />);
    await act(async () => {});
    expect(screen.queryByText('Total Cash Earned')).toBeNull();
  });
});
