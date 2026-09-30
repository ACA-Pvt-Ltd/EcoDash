import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ref, push } from 'firebase/database';
import CollectorChatScreen from '@/app/(collector-tabs)/chat';
import VendorChatScreen from '@/app/(vendor-tabs)/chat';
import UserChatScreen from '@/app/(tabs)/chat';

/**
 * The real Glass purchase from the reported incident. Both parties must land in
 * the same Firebase room for this single WastePurchase document.
 */
const PURCHASE_ID = '6a0c4a3f434f740d9695fd71';
const REQUEST_ID = '6a0402a1def6f37802bfdba2';

let mockParams: Record<string, unknown> = {};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'me-1', name: 'Tester', role: 'collector' } }),
}));

const mockedRef = ref as jest.Mock;
const mockedPush = push as jest.Mock;

/** Every Firebase path the screen subscribed to or wrote to. */
const chatPaths = () =>
  mockedRef.mock.calls.map((c) => String(c[1])).filter((p) => p.startsWith('chats/'));

const roomsTouched = () => Array.from(new Set(chatPaths()));

beforeEach(() => {
  mockParams = {};
});

describe('Chat room resolution across roles', () => {
  describe('collector ↔ vendor on one purchase', () => {
    it('puts the vendor in the pur_ room for the purchase', async () => {
      mockParams = { purchaseId: PURCHASE_ID, collectorName: 'EcoWaste Lanka' };

      render(<VendorChatScreen />);

      await waitFor(() => expect(chatPaths().length).toBeGreaterThan(0));
      expect(roomsTouched()).toEqual([`chats/pur_${PURCHASE_ID}`]);
    });

    it('puts the collector in the pur_ room for the same purchase', async () => {
      mockParams = { purchaseId: PURCHASE_ID, userName: 'Avishka' };

      render(<CollectorChatScreen />);

      await waitFor(() => expect(chatPaths().length).toBeGreaterThan(0));
      expect(roomsTouched()).toEqual([`chats/pur_${PURCHASE_ID}`]);
    });

    /**
     * THE regression test for the reported incident. Before the fix the
     * collector screen hardcoded `req_` while the vendor screen used `pur_`,
     * so the same purchase produced two rooms and neither party saw the other.
     */
    it('lands both parties in the identical room for the same purchase', async () => {
      mockParams = { purchaseId: PURCHASE_ID, collectorName: 'EcoWaste Lanka' };
      const vendorView = render(<VendorChatScreen />);
      await waitFor(() => expect(chatPaths().length).toBeGreaterThan(0));
      const vendorRoom = roomsTouched()[0];
      vendorView.unmount();

      mockedRef.mockClear();

      mockParams = { purchaseId: PURCHASE_ID, userName: 'Avishka' };
      render(<CollectorChatScreen />);
      await waitFor(() => expect(chatPaths().length).toBeGreaterThan(0));
      const collectorRoom = roomsTouched()[0];

      expect(collectorRoom).toBe(vendorRoom);
      expect(collectorRoom).toBe(`chats/pur_${PURCHASE_ID}`);
    });

    it('sends the collector message into the purchase room, not a request room', async () => {
      mockParams = { purchaseId: PURCHASE_ID, userName: 'Avishka' };
      render(<CollectorChatScreen />);
      await waitFor(() => expect(screen.getByPlaceholderText(/Type a message/i)).toBeTruthy());

      const input = screen.getByPlaceholderText(/Type a message/i);
      fireEvent.changeText(input, 'Hi');
      fireEvent(input, 'submitEditing');

      await waitFor(() => expect(mockedPush).toHaveBeenCalled());
      const writtenPath = String(mockedPush.mock.calls[0][0].__path);
      expect(writtenPath).toBe(`chats/pur_${PURCHASE_ID}`);
    });
  });

  describe('user ↔ collector conversations still use req_', () => {
    it('keeps the collector in the req_ room for a household request', async () => {
      mockParams = { requestId: REQUEST_ID, userName: 'Household User' };

      render(<CollectorChatScreen />);

      await waitFor(() => expect(chatPaths().length).toBeGreaterThan(0));
      expect(roomsTouched()).toEqual([`chats/req_${REQUEST_ID}`]);
    });

    it('keeps the household user in the same req_ room', async () => {
      mockParams = { requestId: REQUEST_ID, collectorName: 'EcoWaste Lanka' };

      render(<UserChatScreen />);

      await waitFor(() => expect(chatPaths().length).toBeGreaterThan(0));
      expect(roomsTouched()).toEqual([`chats/req_${REQUEST_ID}`]);
    });

    it('does not mix a purchase conversation into a household request room', async () => {
      mockParams = { purchaseId: PURCHASE_ID, userName: 'Avishka' };

      render(<CollectorChatScreen />);

      await waitFor(() => expect(chatPaths().length).toBeGreaterThan(0));
      expect(roomsTouched()).not.toContain(`chats/req_${PURCHASE_ID}`);
    });
  });

  describe('missing route parameters', () => {
    // Previously produced the shared bucket chats/req_undefined, which every
    // affected user joined and could read.
    it.each([
      ['collector', () => <CollectorChatScreen />],
      ['vendor', () => <VendorChatScreen />],
      ['user', () => <UserChatScreen />],
    ])('the %s screen never subscribes to an undefined room', async (_role, renderScreen) => {
      mockParams = {};

      render(renderScreen());

      await waitFor(() => expect(screen.getByText(/could not be opened/i)).toBeTruthy());
      expect(chatPaths()).toHaveLength(0);
    });

    it('cannot send a message when no conversation was identified', async () => {
      mockParams = {};

      render(<CollectorChatScreen />);

      await waitFor(() => expect(screen.getByText(/could not be opened/i)).toBeTruthy());
      expect(screen.queryByPlaceholderText(/Type a message/i)).toBeNull();
      expect(mockedPush).not.toHaveBeenCalled();
    });
  });

  describe('header labelling', () => {
    it('shows a purchase label for a vendor conversation', async () => {
      mockParams = { purchaseId: PURCHASE_ID, userName: 'Avishka' };

      render(<CollectorChatScreen />);

      await waitFor(() => expect(screen.getByText(/^Purchase ·/)).toBeTruthy());
    });

    it('shows a request label for a household conversation', async () => {
      mockParams = { requestId: REQUEST_ID, userName: 'Household User' };

      render(<CollectorChatScreen />);

      await waitFor(() => expect(screen.getByText(/^Request ·/)).toBeTruthy());
    });
  });
});
