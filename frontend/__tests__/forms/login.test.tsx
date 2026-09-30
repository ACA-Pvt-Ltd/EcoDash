import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';
import { deferred } from '../setup/apiMock';
import { alertTitles, alertMessages } from '../setup/alert';
import { pressAndSettle, resolveAndSettle } from '../setup/interactions';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockLogin = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: jest.fn() }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const fillCredentials = (email = 'user@example.com', password = 'secret123') => {
  fireEvent.changeText(screen.getByPlaceholderText(/email/i), email);
  fireEvent.changeText(screen.getByPlaceholderText(/password/i), password);
};

const submit = async () => pressAndSettle(screen.getByText('Login'));

describe('Login form', () => {
  beforeEach(() => {
    mockLogin.mockResolvedValue(undefined);
  });

  describe('validation', () => {
    it('rejects submission when both fields are empty', async () => {
      render(<LoginScreen />);

      await submit();

      expect(mockLogin).not.toHaveBeenCalled();
      expect(alertMessages()).toContain('Please fill in all fields');
    });

    it('rejects submission when only the password is missing', async () => {
      render(<LoginScreen />);
      fireEvent.changeText(screen.getByPlaceholderText(/email/i), 'user@example.com');

      await submit();

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('accepts a valid email and password', async () => {
      render(<LoginScreen />);
      fillCredentials();

      await submit();

      await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
    });

    it('normalises the email to lowercase and trims it before sending', async () => {
      render(<LoginScreen />);
      fillCredentials('  USER@Example.COM  ', 'secret123');

      await submit();

      await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'secret123', 'user');
    });
  });

  describe('role selection', () => {
    it('submits the user role by default', async () => {
      render(<LoginScreen />);
      fillCredentials();

      await submit();

      await waitFor(() =>
        expect(mockLogin).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'user')
      );
    });

    it('submits the collector role once selected', async () => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByText('Collector'));
      fillCredentials();

      await submit();

      await waitFor(() =>
        expect(mockLogin).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'collector')
      );
    });
  });

  describe('navigation on success', () => {
    it.each([
      ['User', '/(tabs)'],
      ['Collector', '/(collector-tabs)'],
      ['Vendor', '/(vendor-tabs)'],
    ])('sends a %s to %s', async (roleLabel, expectedRoute) => {
      render(<LoginScreen />);
      fireEvent.press(screen.getByText(roleLabel));
      fillCredentials();

      await submit();

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(expectedRoute));
    });

    it('replaces rather than pushes, so back cannot return to login', async () => {
      render(<LoginScreen />);
      fillCredentials();

      await submit();

      await waitFor(() => expect(mockReplace).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalledWith('/(tabs)');
    });
  });

  describe('pending and failure states', () => {
    it('does not navigate while the request is still in flight', async () => {
      const pending = deferred<void>();
      mockLogin.mockReturnValue(pending.promise);
      render(<LoginScreen />);
      fillCredentials();

      await submit();

      await waitFor(() => expect(mockLogin).toHaveBeenCalled());
      expect(mockReplace).not.toHaveBeenCalled();

      await resolveAndSettle(() => pending.resolve());
      await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    });

    it('shows the server message when credentials are wrong', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));
      render(<LoginScreen />);
      fillCredentials();

      await submit();

      await waitFor(() => expect(alertTitles()).toContain('Login Failed'));
      expect(alertMessages()).toContain('Invalid credentials');
    });

    it('does not navigate when login fails', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));
      render(<LoginScreen />);
      fillCredentials();

      await submit();

      await waitFor(() => expect(alertTitles()).toContain('Login Failed'));
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('re-enables the form after a failure so the user can retry', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      render(<LoginScreen />);
      fillCredentials();

      await submit();
      await waitFor(() => expect(alertTitles()).toContain('Login Failed'));

      mockLogin.mockResolvedValueOnce(undefined);
      await submit();

      await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(2));
    });

    // Guards the duplicate-submission requirement. Pressing the retained node a
    // second time reproduces a double-tap: without an in-flight guard both taps
    // read loading === false and fire a login each.
    it('ignores a rapid second tap while the first login is pending', async () => {
      const pending = deferred<void>();
      mockLogin.mockReturnValue(pending.promise);
      render(<LoginScreen />);
      fillCredentials();
      const button = screen.getByText('Login');

      fireEvent.press(button);
      fireEvent.press(button);

      await waitFor(() => expect(mockLogin).toHaveBeenCalled());
      expect(mockLogin).toHaveBeenCalledTimes(1);

      await resolveAndSettle(() => pending.resolve());
    });

    it('replaces the label with a spinner while the login is pending', async () => {
      const pending = deferred<void>();
      mockLogin.mockReturnValue(pending.promise);
      render(<LoginScreen />);
      fillCredentials();

      await submit();

      await waitFor(() => expect(screen.queryByText('Login')).toBeNull());

      await resolveAndSettle(() => pending.resolve());
      await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    });
  });

  describe('support contact', () => {
    it('offers a way to reach support without signing in', () => {
      render(<LoginScreen />);

      expect(screen.getByText(/Having trouble signing in/i)).toBeTruthy();
    });
  });
});
