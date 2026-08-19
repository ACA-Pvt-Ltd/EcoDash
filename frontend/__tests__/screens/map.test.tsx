import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import MapScreen from '@/app/(tabs)/map';
import { makeCollector, ok } from '../setup/factories';
import { deferred } from '../setup/apiMock';
import { alertTitles } from '../setup/alert';
import api from '@/services/api';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockedApi = api as unknown as { get: jest.Mock };

const asCollectionPoint = (over: Record<string, any> = {}) => ({
  ...makeCollector(),
  operatingHours: 'Mon-Fri 9-5',
  ...over,
});

describe('Collection points map screen', () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
  });

  describe('loading state', () => {
    // REGRESSION: `loading` was initialised to false, so the very first paint
    // rendered the "no collectors" empty state before any request had been made.
    it('does not claim there are no collectors before the first response', async () => {
      const pending = deferred();
      mockedApi.get.mockReturnValue(pending.promise);

      render(<MapScreen />);

      expect(screen.queryByText('No collectors found')).toBeNull();

      pending.resolve(ok([]));
      await waitFor(() => expect(screen.getByText('No collectors found')).toBeTruthy());
    });

    it('shows the empty state once an empty result arrives', async () => {
      mockedApi.get.mockResolvedValue(ok([]));

      render(<MapScreen />);

      await waitFor(() => expect(screen.getByText('No collectors found')).toBeTruthy());
    });
  });

  describe('data rendering', () => {
    it('lists collectors returned by the API', async () => {
      mockedApi.get.mockResolvedValue(ok([asCollectionPoint()]));

      render(<MapScreen />);

      await waitFor(() => expect(screen.getByText('Green Recyclers')).toBeTruthy());
    });

    it('shows a rating when the collector has one', async () => {
      mockedApi.get.mockResolvedValue(ok([asCollectionPoint()]));

      render(<MapScreen />);

      await waitFor(() => expect(screen.getByText(/4\.3/)).toBeTruthy());
    });

    it('says so when a collector has no ratings yet', async () => {
      mockedApi.get.mockResolvedValue(
        ok([asCollectionPoint({ averageRating: 0, ratingCount: 0 })])
      );

      render(<MapScreen />);

      await waitFor(() => expect(screen.getByText(/No ratings yet/i)).toBeTruthy());
    });
  });

  describe('resilience to partial API data', () => {
    it('renders a collector with no address', async () => {
      mockedApi.get.mockResolvedValue(ok([asCollectionPoint({ address: undefined })]));

      render(<MapScreen />);

      await waitFor(() => expect(screen.getByText('Green Recyclers')).toBeTruthy());
    });

    it('renders a collector with no location coordinates', async () => {
      mockedApi.get.mockResolvedValue(ok([asCollectionPoint({ location: undefined })]));

      render(<MapScreen />);

      await waitFor(() => expect(screen.getByText('Green Recyclers')).toBeTruthy());
    });

    it('falls back to the empty state when data is not an array', async () => {
      mockedApi.get.mockResolvedValue({ success: true, data: null });

      render(<MapScreen />);

      await waitFor(() => expect(screen.getByText('No collectors found')).toBeTruthy());
    });
  });

  describe('failure handling', () => {
    it('tells the user when collection points cannot be loaded', async () => {
      mockedApi.get.mockRejectedValue({ success: false, message: 'Server error' });

      render(<MapScreen />);

      await waitFor(() => expect(alertTitles()).toContain('Error'));
    });

    it('stops loading after a failure rather than spinning forever', async () => {
      mockedApi.get.mockRejectedValue('Network Error');

      render(<MapScreen />);

      await waitFor(() => expect(screen.getByText('No collectors found')).toBeTruthy());
    });
  });
});
