import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import IndexScreen from '@/app/index';

/**
 * Launch → session restore → role redirect.
 *
 * The three tab groups all expose an index route, and route groups are
 * invisible in the URL, so every dashboard sits at the path "/". Asserting on
 * a resolved pathname is therefore ambiguous; this suite asserts the routing
 * *decision* — the href the screen redirects to — which is unambiguous.
 * (Whether the router then resolves that href to the right group is covered by
 * manual verification; see the report's Remaining Risks.)
 */

const redirects: string[] = [];

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    redirects.push(href);
    return null;
  },
}));

let mockAuth: { user: unknown; loading: boolean } = { user: null, loading: false };

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

beforeEach(() => {
  redirects.length = 0;
});

describe('App launch and session routing', () => {
  describe('while the stored session is still loading', () => {
    it('redirects nowhere until the session has been restored', () => {
      mockAuth = { user: null, loading: true };

      render(<IndexScreen />);

      expect(redirects).toHaveLength(0);
    });

    it('shows a spinner rather than a blank screen', () => {
      mockAuth = { user: null, loading: true };

      render(<IndexScreen />);

      expect(
        screen.UNSAFE_queryAllByType(require('react-native').ActivityIndicator).length
      ).toBeGreaterThan(0);
    });
  });

  describe('unauthenticated launch', () => {
    it('sends a visitor with no session to the welcome screen', async () => {
      mockAuth = { user: null, loading: false };

      render(<IndexScreen />);

      await waitFor(() => expect(redirects).toContain('/(auth)/welcome'));
    });

    it('does not send an unauthenticated visitor into any tab group', () => {
      mockAuth = { user: null, loading: false };

      render(<IndexScreen />);

      expect(redirects).not.toContain('/(tabs)');
      expect(redirects).not.toContain('/(collector-tabs)');
      expect(redirects).not.toContain('/(vendor-tabs)');
    });
  });

  describe('authenticated launch', () => {
    it.each([
      ['user', '/(tabs)'],
      ['collector', '/(collector-tabs)'],
      ['vendor', '/(vendor-tabs)'],
    ])('routes a %s to %s', (role, expected) => {
      mockAuth = { user: { _id: '1', role }, loading: false };

      render(<IndexScreen />);

      expect(redirects).toEqual([expected]);
    });

    it('never sends a collector to the household dashboard', () => {
      mockAuth = { user: { _id: '1', role: 'collector' }, loading: false };

      render(<IndexScreen />);

      expect(redirects).not.toContain('/(tabs)');
    });
  });

  describe('unexpected role values', () => {
    // Documented finding (reported, not fixed): the role check is an equality
    // chain whose `else` catches everything, so an unrecognised value — a
    // different case, an admin account, an empty string — lands on the
    // household dashboard instead of being refused.
    it.each([['Collector'], ['admin'], [''], [undefined]])(
      'routes the unrecognised role %p to the household dashboard',
      (role) => {
        mockAuth = { user: { _id: '1', role }, loading: false };

        render(<IndexScreen />);

        expect(redirects).toEqual(['/(tabs)']);
      }
    );
  });
});
