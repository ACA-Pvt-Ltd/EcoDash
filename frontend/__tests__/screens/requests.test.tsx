import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import RequestsScreen from '@/app/(tabs)/requests';
import { makePurchaseRequest, makeCollector, ok, fail } from '../setup/factories';
import { mockFetchOnce, mockFetchAlways, mockFetchNetworkFailure, deferred } from '../setup/apiMock';
import { confirmAlert, alertTitles, alertMessages } from '../setup/alert';
import { pressAndSettle, resolveAndSettle } from '../setup/interactions';

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { _id: 'user-1', role: 'user' } }),
}));

jest.mock('@/context/AppConfigContext', () => ({
  useAppConfig: () => ({
    wasteCategories: [{ label: 'Plastic', value: 'Plastic', icon: '♻️', color: '#4ECDC4' }],
    pointsPerKg: { Plastic: 10 },
    cashPerKg: { Plastic: 5 },
  }),
}));

/** Reads the JSON body of the Nth fetch call. */
const fetchBody = (callIndex: number) => {
  const call = (global.fetch as jest.Mock).mock.calls[callIndex];
  return JSON.parse(call[1].body);
};

const fetchCallsTo = (fragment: string) =>
  (global.fetch as jest.Mock).mock.calls.filter((c) => String(c[0]).includes(fragment));

describe('Purchase requests screen', () => {
  describe('loading and empty states', () => {
    it('shows a spinner before the first response arrives', async () => {
      const pending = deferred();
      (global.fetch as jest.Mock).mockImplementationOnce(() => pending.promise);

      render(<RequestsScreen />);

      expect(screen.getByText(/Loading requests/i)).toBeTruthy();
      expect(screen.queryByText(/No Purchase Requests/i)).toBeNull();

      await resolveAndSettle(() => pending.resolve({ ok: true, json: async () => ok([]) } as never));
      await waitFor(() => expect(screen.getByText(/No Purchase Requests/i)).toBeTruthy());
    });

    it('shows the empty state when the user has no requests', async () => {
      mockFetchAlways(ok([]));

      render(<RequestsScreen />);

      await waitFor(() => expect(screen.getByText(/No Purchase Requests/i)).toBeTruthy());
    });

    it('renders a pending request with its collector and price', async () => {
      mockFetchAlways(ok([makePurchaseRequest()]));

      render(<RequestsScreen />);

      await waitFor(() => expect(screen.getByText('Green Recyclers')).toBeTruthy());
      expect(screen.getByText('Accept')).toBeTruthy();
      expect(screen.getByText('Reject')).toBeTruthy();
    });
  });

  describe('responding to a request', () => {
    const openConfirmModal = async (buttonLabel: 'Accept' | 'Reject') => {
      mockFetchAlways(ok([makePurchaseRequest()]));
      render(<RequestsScreen />);
      await waitFor(() => expect(screen.getByText(buttonLabel)).toBeTruthy());

      await pressAndSettle(screen.getByText(buttonLabel));
      // the Alert's Accept/Reject button opens the message modal
      await resolveAndSettle(() => confirmAlert());

      await waitFor(() => expect(screen.getByText('Confirm')).toBeTruthy());
    };

    it('sends response "accept" when the user accepts', async () => {
      await openConfirmModal('Accept');
      (global.fetch as jest.Mock).mockClear();
      mockFetchAlways(ok(null));

      await pressAndSettle(screen.getByText('Confirm'));

      await waitFor(() => expect(fetchCallsTo('/purchase-requests/').length).toBe(1));
      expect(fetchBody(0).response).toBe('accept');
    });

    // REGRESSION: openResponseModal() captured `isAccept` only inside the Alert
    // closure and never stored it. The modal's Confirm recomputed the verb as
    // `selectedRequest?.status === 'pending'`, which is always true for a
    // request showing Accept/Reject — so Reject sent "accept" and sold the
    // user's waste to a collector they had just turned down.
    it('sends response "reject" when the user rejects', async () => {
      await openConfirmModal('Reject');
      (global.fetch as jest.Mock).mockClear();
      mockFetchAlways(ok(null));

      await pressAndSettle(screen.getByText('Confirm'));

      await waitFor(() => expect(fetchCallsTo('/purchase-requests/').length).toBe(1));
      expect(fetchBody(0).response).toBe('reject');
    });

    it('tells the user their request was rejected, not accepted', async () => {
      await openConfirmModal('Reject');
      mockFetchAlways(ok(null));

      await pressAndSettle(screen.getByText('Confirm'));

      await waitFor(() => expect(alertMessages().join(' ')).toMatch(/rejected/i));
      expect(alertMessages().join(' ')).not.toMatch(/accepted!/i);
    });

    it('includes the typed message in the request body', async () => {
      await openConfirmModal('Accept');
      fireEvent.changeText(
        screen.getByPlaceholderText(/Your message to the collector/i),
        '  Please come after 5pm  '
      );
      (global.fetch as jest.Mock).mockClear();
      mockFetchAlways(ok(null));

      await pressAndSettle(screen.getByText('Confirm'));

      await waitFor(() => expect(fetchCallsTo('/purchase-requests/').length).toBe(1));
      expect(fetchBody(0).message).toBe('Please come after 5pm');
    });

    it('disables Confirm while the response is in flight, preventing a double submit', async () => {
      await openConfirmModal('Accept');
      const inFlight = deferred();
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockImplementation(() => inFlight.promise);

      await pressAndSettle(screen.getByText('Confirm'));
      await waitFor(() => expect(fetchCallsTo('/purchase-requests/').length).toBe(1));

      // A second tap while pending must not fire another request
      const confirmButtons = screen.UNSAFE_queryAllByProps({ disabled: true });
      expect(confirmButtons.length).toBeGreaterThan(0);

      await resolveAndSettle(() => inFlight.resolve({ ok: true, json: async () => ok(null) } as never));
      await waitFor(() => expect(fetchCallsTo('/purchase-requests/').length).toBe(1));
    });

    it('surfaces a server error instead of claiming success', async () => {
      await openConfirmModal('Accept');
      (global.fetch as jest.Mock).mockClear();
      mockFetchOnce(fail('Offer already sold'));

      await pressAndSettle(screen.getByText('Confirm'));

      await waitFor(() => expect(alertMessages()).toContain('Offer already sold'));
    });

    it('surfaces a network failure instead of failing silently', async () => {
      await openConfirmModal('Accept');
      (global.fetch as jest.Mock).mockClear();
      mockFetchNetworkFailure();

      await pressAndSettle(screen.getByText('Confirm'));

      await waitFor(() => expect(alertTitles()).toContain('Error'));
    });
  });

  describe('resilience to partial API data', () => {
    it('renders a request whose collector has no rating fields', async () => {
      mockFetchAlways(
        ok([
          makePurchaseRequest({
            collector: makeCollector({ averageRating: undefined, ratingCount: undefined }),
          }),
        ])
      );

      render(<RequestsScreen />);

      await waitFor(() => expect(screen.getByText('Green Recyclers')).toBeTruthy());
    });

    it('shows the empty state rather than crashing when data is null', async () => {
      mockFetchAlways({ success: true, data: null });

      render(<RequestsScreen />);

      await waitFor(() => expect(screen.getByText(/No Purchase Requests/i)).toBeTruthy());
    });
  });
});
