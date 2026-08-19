import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ScanScreen from '@/app/(collector-tabs)/scan';
import { makeUser, ok } from '../setup/factories';
import { alertMessages } from '../setup/alert';
import api from '@/services/api';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'collector-1', role: 'collector', acceptedWasteTypes: ['Plastic'] },
    token: 'test-token',
    refreshUser: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/context/AppConfigContext', () => ({
  useAppConfig: () => ({
    wasteCategories: [{ label: 'Plastic', value: 'Plastic', icon: '♻️', color: '#4ECDC4' }],
    pointsPerKg: { Plastic: 10 },
    cashPerKg: { Plastic: 5 },
  }),
}));

const mockedApi = api as unknown as { post: jest.Mock };

/** Verifies a user by QR so the record-collection form becomes reachable. */
const scanAUser = async () => {
  mockedApi.post.mockResolvedValueOnce(
    ok({ user: makeUser(), recentTransactions: [] })
  );
  fireEvent.changeText(screen.getByPlaceholderText(/Enter QR code manually/i), 'QR-USER-1');
  fireEvent.press(screen.getByText('Verify User'));
  await waitFor(() => expect(screen.getByText('Nimal Perera')).toBeTruthy());
};

const openCollectionForm = async () => {
  fireEvent.press(screen.getByText('Add Waste Collection'));
  await waitFor(() => expect(screen.getByPlaceholderText('e.g., 2.5')).toBeTruthy());
  fireEvent.press(screen.getByText('Plastic'));
};

const weightInput = () => screen.getByPlaceholderText('e.g., 2.5');
const submitCollection = () => fireEvent.press(screen.getByText(/Submit & Award Points/i));

describe('Collector record-collection form', () => {
  beforeEach(() => {
    mockedApi.post.mockReset();
  });

  describe('QR verification', () => {
    it('shows the scanned user after a successful lookup', async () => {
      render(<ScanScreen />);

      await scanAUser();

      expect(screen.getByText('Nimal Perera')).toBeTruthy();
    });

    it('tells the collector when the user is not found', async () => {
      render(<ScanScreen />);
      mockedApi.post.mockResolvedValueOnce({ success: false, message: 'User not found' });

      fireEvent.changeText(screen.getByPlaceholderText(/Enter QR code manually/i), 'BAD-QR');
      fireEvent.press(screen.getByText('Verify User'));

      await waitFor(() => expect(alertMessages().join(' ')).toMatch(/not found/i));
    });

    it('surfaces a network failure during verification', async () => {
      render(<ScanScreen />);
      mockedApi.post.mockRejectedValueOnce('Network Error');

      fireEvent.changeText(screen.getByPlaceholderText(/Enter QR code manually/i), 'QR-USER-1');
      fireEvent.press(screen.getByText('Verify User'));

      await waitFor(() => expect(alertMessages().length).toBeGreaterThan(0));
    });
  });

  describe('weight validation', () => {
    // REGRESSION: `!weight || parseFloat(weight) <= 0` let NaN through, so a
    // typo posted quantity: null and awarded points against a null weight.
    it.each([
      ['non-numeric text', 'abc'],
      ['a lone minus sign', '-'],
      ['an overflowing value', '1e400'],
    ])('rejects %s rather than recording a null quantity', async (_label, value) => {
      render(<ScanScreen />);
      await scanAUser();
      await openCollectionForm();
      mockedApi.post.mockClear();

      fireEvent.changeText(weightInput(), value);
      submitCollection();

      expect(mockedApi.post).not.toHaveBeenCalled();
      expect(alertMessages().join(' ')).toMatch(/valid weight/i);
    });

    it.each([
      ['zero', '0'],
      ['negative', '-5'],
    ])('rejects a %s weight', async (_label, value) => {
      render(<ScanScreen />);
      await scanAUser();
      await openCollectionForm();
      mockedApi.post.mockClear();

      fireEvent.changeText(weightInput(), value);
      submitCollection();

      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('records a valid weight as a finite number', async () => {
      render(<ScanScreen />);
      await scanAUser();
      await openCollectionForm();
      mockedApi.post.mockClear();
      mockedApi.post.mockResolvedValueOnce(
        ok({ transaction: { pointsEarned: 25, cashAmount: 0 }, newBadges: null })
      );

      fireEvent.changeText(weightInput(), '2.5');
      submitCollection();

      await waitFor(() => expect(mockedApi.post).toHaveBeenCalled());
      const body = mockedApi.post.mock.calls[0][1];
      expect(body.quantity).toBe(2.5);
      expect(Number.isFinite(body.quantity)).toBe(true);
    });

    it('requires a waste type before submitting', async () => {
      render(<ScanScreen />);
      await scanAUser();
      fireEvent.press(screen.getByText('Add Waste Collection'));
      await waitFor(() => expect(screen.getByPlaceholderText('e.g., 2.5')).toBeTruthy());
      mockedApi.post.mockClear();

      fireEvent.changeText(weightInput(), '2.5');
      submitCollection();

      expect(mockedApi.post).not.toHaveBeenCalled();
    });
  });

  describe('submission failures', () => {
    it('surfaces a server rejection instead of claiming the collection succeeded', async () => {
      render(<ScanScreen />);
      await scanAUser();
      await openCollectionForm();
      mockedApi.post.mockClear();
      mockedApi.post.mockRejectedValueOnce({ success: false, message: 'Waste type not accepted' });

      fireEvent.changeText(weightInput(), '2.5');
      submitCollection();

      await waitFor(() => expect(alertMessages().length).toBeGreaterThan(0));
    });
  });
});
