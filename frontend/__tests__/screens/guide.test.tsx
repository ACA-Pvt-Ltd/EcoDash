import React from 'react';
import { render, screen, fireEvent, waitFor, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import GuideScreen from '@/app/guide';
import { GUIDE_SLIDES } from '@/constants/onboarding';
import { GUIDE_SEEN_KEY, useFirstRunGuide } from '@/hooks/useFirstRunGuide';

let mockParams: Record<string, unknown> = {};
let mockUser: { _id: string; role: string } | null = { _id: 'u1', role: 'user' };

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const mockedRouter = router as unknown as { push: jest.Mock; back: jest.Mock; replace: jest.Mock };

beforeEach(async () => {
  mockParams = {};
  mockUser = { _id: 'u1', role: 'user' };
  await AsyncStorage.clear();
});

describe('Guide screen', () => {
  it.each(['user', 'collector', 'vendor'] as const)('shows the %s guide', (role) => {
    mockUser = { _id: 'u1', role };
    render(<GuideScreen />);
    expect(screen.getByText(GUIDE_SLIDES[role][0].title)).toBeTruthy();
    expect(screen.getByText(`1 of ${GUIDE_SLIDES[role].length}`)).toBeTruthy();
  });

  it('steps through with Next, hides Skip on the last slide, and finishes with Get started', async () => {
    render(<GuideScreen />);
    const total = GUIDE_SLIDES.user.length;
    for (let i = 1; i < total; i++) fireEvent.press(screen.getByText('Next'));

    expect(screen.getByText(`${total} of ${total}`)).toBeTruthy();
    expect(screen.queryByText('Skip')).toBeNull();

    fireEvent.press(screen.getByText('Get started'));
    await waitFor(() => expect(mockedRouter.replace).toHaveBeenCalledWith('/(tabs)'));
    expect(await AsyncStorage.getItem(GUIDE_SEEN_KEY('u1'))).toBe('1');
  });

  it('Skip marks the guide seen and goes to the role home', async () => {
    mockUser = { _id: 'c1', role: 'collector' };
    render(<GuideScreen />);

    fireEvent.press(screen.getByText('Skip'));

    await waitFor(() => expect(mockedRouter.replace).toHaveBeenCalledWith('/(collector-tabs)'));
    expect(await AsyncStorage.getItem(GUIDE_SEEN_KEY('c1'))).toBe('1');
  });

  it('returns to the profile when replayed from there', async () => {
    mockParams = { replay: '1' };
    render(<GuideScreen />);

    fireEvent.press(screen.getByText('Skip'));

    await waitFor(() => expect(mockedRouter.back).toHaveBeenCalled());
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });
});

describe('useFirstRunGuide', () => {
  it('opens the guide once for an account that has not seen it', async () => {
    const { rerender } = renderHook(() => useFirstRunGuide());
    await waitFor(() => expect(mockedRouter.push).toHaveBeenCalledWith('/guide'));
    rerender({});
    await new Promise((r) => setTimeout(r, 0));
    expect(mockedRouter.push).toHaveBeenCalledTimes(1);
  });

  it('does nothing once the guide has been seen', async () => {
    await AsyncStorage.setItem(GUIDE_SEEN_KEY('u1'), '1');
    renderHook(() => useFirstRunGuide());
    await new Promise((r) => setTimeout(r, 0));
    expect(mockedRouter.push).not.toHaveBeenCalled();
  });

  it('does nothing before anyone is signed in', async () => {
    mockUser = null;
    renderHook(() => useFirstRunGuide());
    await new Promise((r) => setTimeout(r, 0));
    expect(mockedRouter.push).not.toHaveBeenCalled();
  });
});
