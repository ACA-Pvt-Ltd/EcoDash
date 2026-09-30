import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PerformanceBadge from '@/components/PerformanceBadge';

const perf = (over: Record<string, any> = {}) => ({
  score: 72,
  collectionsLast30Days: 14,
  completionRate: 90,
  avgResponseHours: 3.5,
  ...over,
});

describe('PerformanceBadge', () => {
  describe('insufficient data', () => {
    it.each([
      ['no performance object', undefined],
      ['a null performance object', null],
    ])('shows the building-reputation state for %s', (_label, value) => {
      render(<PerformanceBadge performance={value as never} />);

      expect(screen.getByText('Building reputation')).toBeTruthy();
    });

    it('shows the building-reputation state for a null score', () => {
      render(<PerformanceBadge performance={perf({ score: null })} />);

      expect(screen.getByText('Building reputation')).toBeTruthy();
    });

    it('never renders a numeric score when there is not enough data', () => {
      render(<PerformanceBadge performance={perf({ score: null })} />);

      expect(screen.queryByText('0')).toBeNull();
    });
  });

  describe('score bands', () => {
    it.each([
      [95, 'Excellent'],
      [80, 'Excellent'],
      [79, 'Reliable'],
      [60, 'Reliable'],
      [59, 'Fair'],
      [40, 'Fair'],
      [39, 'Building up'],
      [0, 'Building up'],
    ])('labels a score of %i as %s', (score, label) => {
      render(<PerformanceBadge performance={perf({ score })} />);

      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.getByText(String(score))).toBeTruthy();
    });
  });

  describe('compact variant', () => {
    it('still shows the score and label', () => {
      render(<PerformanceBadge performance={perf({ score: 85 })} compact />);

      expect(screen.getByText('85')).toBeTruthy();
      expect(screen.getByText('Excellent')).toBeTruthy();
    });
  });
});
