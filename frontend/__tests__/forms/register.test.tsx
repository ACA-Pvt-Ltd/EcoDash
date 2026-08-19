import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '@/app/(auth)/register';
import { deferred } from '../setup/apiMock';
import { alertTitles, alertMessages } from '../setup/alert';
import { pressAndSettle, resolveAndSettle } from '../setup/interactions';

const mockReplace = jest.fn();
const mockRegister = jest.fn();
let mockParams: Record<string, unknown> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

const fillRequired = (over: Partial<Record<string, string>> = {}) => {
  fireEvent.changeText(screen.getByPlaceholderText('Enter your name'), over.name ?? 'Nimal Perera');
  fireEvent.changeText(screen.getByPlaceholderText('Enter your email'), over.email ?? 'nimal@example.com');
  fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), over.password ?? 'secret123');
  fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), over.confirm ?? 'secret123');
};

const submit = async () => pressAndSettle(screen.getByText('Create Account'));

describe('Register form', () => {
  beforeEach(() => {
    mockParams = { role: 'user' };
    mockRegister.mockResolvedValue(undefined);
  });

  describe('role route parameter', () => {
    it('registers as a user when no role param is supplied', () => {
      mockParams = {};

      render(<RegisterScreen />);

      expect(screen.getByText(/Register as User/i)).toBeTruthy();
    });

    it.each(['user', 'collector', 'vendor'])('renders the %s registration form', (role) => {
      mockParams = { role };

      render(<RegisterScreen />);

      expect(screen.getByText(new RegExp(`Register as ${role}`, 'i'))).toBeTruthy();
    });

    // REGRESSION: `roleConfigs[role]` was undefined for any unrecognised value,
    // and the header dereferenced `roleConfig.icon` — so a link such as
    // /register?role=admin crashed the screen outright.
    it('falls back to the user form instead of crashing on an unknown role', () => {
      mockParams = { role: 'admin' };

      expect(() => render(<RegisterScreen />)).not.toThrow();
      expect(screen.getByText(/Register as User/i)).toBeTruthy();
    });

    it('falls back to the user form when the role param is repeated (array)', () => {
      mockParams = { role: ['user', 'collector'] };

      expect(() => render(<RegisterScreen />)).not.toThrow();
      expect(screen.getByText(/Register as User/i)).toBeTruthy();
    });

    it('does not register an unknown role with the backend', async () => {
      mockParams = { role: 'admin' };
      render(<RegisterScreen />);
      fillRequired();

      await submit();

      await waitFor(() => expect(mockRegister).toHaveBeenCalled());
      expect(mockRegister.mock.calls[0][0].role).toBe('user');
    });
  });

  describe('validation', () => {
    it('rejects an empty form', async () => {
      render(<RegisterScreen />);

      await submit();

      expect(mockRegister).not.toHaveBeenCalled();
      expect(alertMessages()).toContain('Please fill in all required fields');
    });

    it('rejects mismatched passwords', async () => {
      render(<RegisterScreen />);
      fillRequired({ confirm: 'different' });

      await submit();

      expect(mockRegister).not.toHaveBeenCalled();
      expect(alertMessages()).toContain('Passwords do not match');
    });

    it('rejects a password shorter than 6 characters', async () => {
      render(<RegisterScreen />);
      fillRequired({ password: 'abc', confirm: 'abc' });

      await submit();

      expect(mockRegister).not.toHaveBeenCalled();
      expect(alertMessages()).toContain('Password must be at least 6 characters');
    });

    it('accepts a valid user registration', async () => {
      render(<RegisterScreen />);
      fillRequired();

      await submit();

      await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
      expect(mockRegister.mock.calls[0][0]).toMatchObject({
        name: 'Nimal Perera',
        email: 'nimal@example.com',
        role: 'user',
      });
    });

    it('lowercases and trims the email before sending', async () => {
      render(<RegisterScreen />);
      fillRequired({ email: '  NIMAL@Example.COM ' });

      await submit();

      await waitFor(() => expect(mockRegister).toHaveBeenCalled());
      expect(mockRegister.mock.calls[0][0].email).toBe('nimal@example.com');
    });
  });

  describe('collector-specific validation', () => {
    beforeEach(() => {
      mockParams = { role: 'collector' };
    });

    it('requires at least one accepted waste type', async () => {
      render(<RegisterScreen />);
      fillRequired();

      await submit();

      expect(mockRegister).not.toHaveBeenCalled();
      expect(alertMessages().join(' ')).toMatch(/waste type/i);
    });
  });

  describe('vendor-specific validation', () => {
    beforeEach(() => {
      mockParams = { role: 'vendor' };
    });

    it('requires a business type', async () => {
      render(<RegisterScreen />);
      fillRequired();

      await submit();

      expect(mockRegister).not.toHaveBeenCalled();
      expect(alertMessages().join(' ')).toMatch(/business type/i);
    });
  });

  describe('submission', () => {
    it('navigates to the user tabs after a successful registration', async () => {
      render(<RegisterScreen />);
      fillRequired();

      await submit();

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
    });

    it('shows the server error and stays on the form when registration fails', async () => {
      mockRegister.mockRejectedValue(new Error('Email already registered'));
      render(<RegisterScreen />);
      fillRequired();

      await submit();

      await waitFor(() => expect(alertTitles()).toContain('Registration Failed'));
      expect(alertMessages()).toContain('Email already registered');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('ignores a rapid second tap while registration is pending', async () => {
      const pending = deferred<void>();
      mockRegister.mockReturnValue(pending.promise);
      render(<RegisterScreen />);
      fillRequired();
      const button = screen.getByText('Create Account');

      fireEvent.press(button);
      fireEvent.press(button);

      await waitFor(() => expect(mockRegister).toHaveBeenCalled());
      expect(mockRegister).toHaveBeenCalledTimes(1);

      await resolveAndSettle(() => pending.resolve());
    });
  });
});
