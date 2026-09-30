import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import UserOfferDetailsScreen from '@/app/(collector-tabs)/user-offer-details';
import VendorOfferDetailsScreen from '@/app/(vendor-tabs)/offer-details';
import api from '@/services/api';
import { fetchResponse } from '../setup/apiMock';
import { lastAlert } from '../setup/alert';

let mockParams: Record<string, unknown> = {};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { _id: 'me', role: 'collector' } }),
}));

jest.mock('@/context/AppConfigContext', () => ({
  useAppConfig: () => ({
    wasteCategories: [{ label: 'Plastic', value: 'Plastic', icon: '♻️', color: '#4ECDC4' }],
  }),
}));

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedApi = api as unknown as { get: jest.Mock };

const OFFER_ID = 'offer-1';

/** Waits for the Call button, identified by its locked / unlocked accessibility label. */
const callButton = (locked: boolean, name = '') =>
  waitFor(() => screen.getByLabelText(locked ? 'Call (locked)' : `Call ${name}`));

describe('Call button on offer details', () => {
  beforeEach(() => {
    mockParams = { offerId: OFFER_ID };
  });

  describe('collector viewing a user offer', () => {
    const offer = {
      _id: OFFER_ID,
      user: { _id: 'u1', name: 'Avi', phone: '+94 77 123 4567' },
      wasteType: 'Plastic',
      quantity: { value: 2, unit: 'kg' },
      expectedPrice: 23,
      location: { address: '1 Main St', city: 'Colombo' },
      status: 'available',
      availableFrom: '2026-10-01T00:00:00Z',
      createdAt: '2026-10-01T00:00:00Z',
    };

    const stub = (requests: unknown[]) =>
      (global.fetch as jest.Mock).mockImplementation((url: string) =>
        fetchResponse({ success: true, data: String(url).includes('requests') ? requests : [offer] })
      );

    it('is locked like Chat before a request is sent, and prompts for one', async () => {
      stub([]);
      render(<UserOfferDetailsScreen />);

      fireEvent.press(await callButton(true));

      expect(screen.getByLabelText('Chat (locked)')).toBeTruthy();
      expect(lastAlert().title).toBe('Request Required');
      expect(lastAlert().message).toMatch(/before you can call this user/);
      expect(lastAlert().buttons.map(b => b.text)).toEqual(['Cancel', 'Send Request']);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('unlocks together with Chat once a request exists, and dials the user', async () => {
      stub([{ _id: 'req-1', userOffer: OFFER_ID, status: 'pending' }]);
      render(<UserOfferDetailsScreen />);

      fireEvent.press(await callButton(false, 'Avi'));

      expect(screen.getByLabelText('Chat with Avi')).toBeTruthy();
      await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith('tel:+94771234567'));
    });

    it('explains when the user has no phone number', async () => {
      offer.user.phone = '';
      stub([{ _id: 'req-1', userOffer: { _id: OFFER_ID }, status: 'accepted' }]);
      render(<UserOfferDetailsScreen />);

      fireEvent.press(await callButton(false, 'Avi'));

      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('No phone number', expect.stringContaining('Avi')));
      expect(Linking.openURL).not.toHaveBeenCalled();
      offer.user.phone = '+94 77 123 4567';
    });
  });

  describe('vendor viewing a collector offer', () => {
    const offer = {
      _id: OFFER_ID,
      collector: { _id: 'c1', name: 'Green Recyclers', phone: '077 555 0000' },
      wasteType: 'Plastic',
      quantity: { value: 120, unit: 'kg' },
      minPricePerKg: 40,
      status: 'available',
      createdAt: '2026-10-01T00:00:00Z',
    };

    const stub = (purchases: unknown[]) =>
      mockedApi.get.mockImplementation((path: string) =>
        Promise.resolve({ success: true, data: String(path).includes('purchases') ? purchases : [offer] })
      );

    it('is locked like Chat before a purchase, and prompts for one', async () => {
      stub([]);
      render(<VendorOfferDetailsScreen />);

      fireEvent.press(await callButton(true));

      expect(screen.getByLabelText('Chat (locked)')).toBeTruthy();
      expect(lastAlert().title).toBe('Purchase Required');
      expect(lastAlert().message).toMatch(/before you can call this collector/);
      expect(Linking.openURL).not.toHaveBeenCalled();
    });

    it('unlocks together with Chat once a purchase exists, and dials the collector', async () => {
      stub([{ _id: 'p1', offer: OFFER_ID, status: 'pending' }]);
      render(<VendorOfferDetailsScreen />);

      fireEvent.press(await callButton(false, 'Green Recyclers'));

      expect(screen.getByLabelText('Chat with Green Recyclers')).toBeTruthy();
      await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith('tel:0775550000'));
    });
  });
});
