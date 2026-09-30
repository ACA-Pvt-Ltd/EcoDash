import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { STORAGE_KEYS } from '@/constants/config';
import { makeUser, ok } from '../setup/factories';
import api from '@/services/api';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockedApi = api as unknown as { get: jest.Mock; post: jest.Mock };

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

/** loadUser defers setLoading(false) behind a 100ms timer. */
const renderAuth = async () => {
  const view = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
};

beforeEach(async () => {
  await AsyncStorage.clear();
  mockedApi.get.mockReset();
  mockedApi.post.mockReset();
});

describe('session restore on launch', () => {
  it('starts in a loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('finishes loading with no user when storage is empty', async () => {
    const { result } = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('restores a stored session', async () => {
    const user = makeUser();
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, 'stored-token'],
      [STORAGE_KEYS.USER, JSON.stringify(user)],
      [STORAGE_KEYS.USER_ROLE, 'user'],
    ]);

    const { result } = await renderAuth();

    expect(result.current.token).toBe('stored-token');
    expect(result.current.user).toMatchObject({ _id: 'user-1', role: 'user' });
  });

  it('stays logged out when the stored user blob is corrupt', async () => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, 'stored-token'],
      [STORAGE_KEYS.USER, 'not-json{{'],
    ]);

    const { result } = await renderAuth();

    expect(result.current.user).toBeNull();
  });

  it('stays logged out when a token exists without a user record', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, 'orphan-token');

    const { result } = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

describe('login', () => {
  it('stores the token, user and role, and exposes them', async () => {
    const user = makeUser();
    mockedApi.post.mockResolvedValue({ success: true, data: user, token: 'new-token' });
    const { result } = await renderAuth();

    await act(async () => {
      await result.current.login('nimal@example.com', 'secret123', 'user');
    });

    expect(result.current.token).toBe('new-token');
    expect(result.current.user).toMatchObject({ _id: 'user-1' });
    expect(await AsyncStorage.getItem(STORAGE_KEYS.TOKEN)).toBe('new-token');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE)).toBe('user');
  });

  it('throws and leaves the session empty when the server rejects the login', async () => {
    mockedApi.post.mockResolvedValue({ success: false, message: 'Invalid credentials' });
    const { result } = await renderAuth();

    await expect(
      act(async () => {
        await result.current.login('nimal@example.com', 'wrong', 'user');
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBeNull();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
  });

  it('throws when the request fails outright', async () => {
    mockedApi.post.mockRejectedValue({ success: false, message: 'Server unavailable' });
    const { result } = await renderAuth();

    await expect(
      act(async () => {
        await result.current.login('nimal@example.com', 'secret123', 'user');
      })
    ).rejects.toBeDefined();

    expect(result.current.user).toBeNull();
  });
});

describe('logout', () => {
  const loginFirst = async () => {
    mockedApi.post.mockResolvedValue({ success: true, data: makeUser(), token: 'new-token' });
    const view = await renderAuth();
    await act(async () => {
      await view.result.current.login('nimal@example.com', 'secret123', 'user');
    });
    return view;
  };

  it('clears every stored auth key', async () => {
    const { result } = await loginFirst();

    await act(async () => {
      await result.current.logout();
    });

    expect(await AsyncStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE)).toBeNull();
  });

  it('clears the in-memory session', async () => {
    const { result } = await loginFirst();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  // REGRESSION: setToken(null)/setUser(null) sat after the await inside try, so
  // a storage failure skipped them entirely — the app navigated to the login
  // screen while useAuth() still reported a fully authenticated user.
  it('clears the in-memory session even if storage fails to clear', async () => {
    const { result } = await loginFirst();
    const multiRemove = jest
      .spyOn(AsyncStorage, 'multiRemove')
      .mockRejectedValueOnce(new Error('storage unavailable'));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();

    multiRemove.mockRestore();
  });

  it('leaves no stale user behind for the next login', async () => {
    const { result } = await loginFirst();
    await act(async () => {
      await result.current.logout();
    });

    mockedApi.post.mockResolvedValue({
      success: true,
      data: makeUser({ _id: 'user-2', name: 'Second User', role: 'collector' }),
      token: 'second-token',
    });
    await act(async () => {
      await result.current.login('second@example.com', 'secret123', 'collector');
    });

    expect(result.current.user).toMatchObject({ _id: 'user-2', role: 'collector' });
    expect(await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE)).toBe('collector');
  });
});

describe('updateUser', () => {
  it('merges changes into the stored user', async () => {
    mockedApi.post.mockResolvedValue({ success: true, data: makeUser(), token: 't' });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.login('nimal@example.com', 'secret123', 'user');
    });

    await act(async () => {
      result.current.updateUser({ points: 999 });
    });

    expect(result.current.user?.points).toBe(999);
    await waitFor(async () => {
      const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.USER)) ?? '{}');
      expect(stored.points).toBe(999);
    });
  });

  it('is a no-op when nobody is signed in', async () => {
    const { result } = await renderAuth();

    await act(async () => {
      result.current.updateUser({ points: 5 });
    });

    expect(result.current.user).toBeNull();
  });
});

describe('refreshUser', () => {
  it('replaces the cached user with the server copy', async () => {
    mockedApi.post.mockResolvedValue({ success: true, data: makeUser(), token: 't' });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.login('nimal@example.com', 'secret123', 'user');
    });

    mockedApi.get.mockResolvedValue(ok(makeUser({ points: 500 })));
    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user?.points).toBe(500);
  });

  it('keeps the existing session when the refresh fails', async () => {
    mockedApi.post.mockResolvedValue({ success: true, data: makeUser(), token: 't' });
    const { result } = await renderAuth();
    await act(async () => {
      await result.current.login('nimal@example.com', 'secret123', 'user');
    });

    mockedApi.get.mockRejectedValue('Network Error');
    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toMatchObject({ _id: 'user-1' });
  });
});
