import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import CreatePurchaseRequestScreen from '@/app/(collector-tabs)/create-purchase-request';
import { ok } from '../setup/factories';
import { mockFetchAlways } from '../setup/apiMock';
import { alertMessages } from '../setup/alert';

/**
 * Numeric inputs across the app are parsed with parseFloat and compared with
 * `<= 0`. Because `NaN <= 0` is false, any non-numeric text slipped past
 * validation and was posted as `null` once JSON.stringify saw the NaN.
 */

let mockParams: Record<string, unknown> = { offerId: 'offer-1' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { _id: 'collector-1', role: 'collector' } }),
}));

const priceInput = () => screen.getByPlaceholderText('Enter your price offer');
const submit = () => fireEvent.press(screen.getByText('Send Request'));

const bodyOfLastFetch = () => {
  const calls = (global.fetch as jest.Mock).mock.calls;
  return JSON.parse(calls[calls.length - 1][1].body);
};

describe('Collector purchase request — price validation', () => {
  beforeEach(() => {
    mockParams = { offerId: 'offer-1' };
    mockFetchAlways(ok({ _id: 'request-1' }));
  });

  describe('values that must be rejected', () => {
    it.each([
      ['empty', ''],
      ['zero', '0'],
      ['negative', '-50'],
    ])('rejects a %s price', (_label, value) => {
      render(<CreatePurchaseRequestScreen />);
      fireEvent.changeText(priceInput(), value);

      submit();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(alertMessages().join(' ')).toMatch(/valid price/i);
    });

    // REGRESSION: parseFloat('abc') is NaN, and `NaN <= 0` is false, so this
    // passed validation and posted {"offeredPrice": null}.
    it.each([
      ['non-numeric text', 'abc'],
      ['a lone minus sign', '-'],
      ['a lone decimal point', '.'],
    ])('rejects %s instead of posting null', (_label, value) => {
      render(<CreatePurchaseRequestScreen />);
      fireEvent.changeText(priceInput(), value);

      submit();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(alertMessages().join(' ')).toMatch(/valid price/i);
    });

    // parseFloat('1e400') is Infinity: isNaN(Infinity) is false and it is > 0,
    // so it passed every check and JSON.stringify turned it into null.
    it('rejects a value that overflows to Infinity', () => {
      render(<CreatePurchaseRequestScreen />);
      fireEvent.changeText(priceInput(), '1e400');

      submit();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('values that must be accepted', () => {
    it.each([
      ['a whole number', '500', 500],
      ['a decimal', '499.5', 499.5],
      ['a very small positive number', '0.01', 0.01],
    ])('accepts %s', async (_label, typed, expected) => {
      render(<CreatePurchaseRequestScreen />);
      fireEvent.changeText(priceInput(), typed);

      submit();

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      expect(bodyOfLastFetch().offeredPrice).toBe(expected);
    });

    it('never sends a null price for an accepted submission', async () => {
      render(<CreatePurchaseRequestScreen />);
      fireEvent.changeText(priceInput(), '250');

      submit();

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());
      const body = bodyOfLastFetch();
      expect(body.offeredPrice).not.toBeNull();
      expect(Number.isFinite(body.offeredPrice)).toBe(true);
    });
  });

  describe('route parameter handling', () => {
    // Without a guard the URL became /user-offers/undefined/request
    it('does not post to an undefined offer id when the param is missing', () => {
      mockParams = {};
      render(<CreatePurchaseRequestScreen />);
      fireEvent.changeText(priceInput(), '500');

      submit();

      const urls = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
      expect(urls.some((u) => u.includes('undefined'))).toBe(false);
    });
  });
});
