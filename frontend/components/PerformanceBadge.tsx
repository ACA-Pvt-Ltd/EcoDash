import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/config';
import type { CollectorPerformance } from '@/context/AuthContext';

/**
 * Compact pill showing a collector's metrics-derived performance score.
 * Distinct from the star rating, which is what users submitted about them.
 *
 * A null score means the collector has not been active enough to be scored —
 * render "Building reputation", never a 0, which would read as a bad collector.
 */

interface Props {
  performance?: CollectorPerformance | null;
  compact?: boolean;
}

function bandFor(score: number) {
  if (score >= 80) return { label: 'Excellent', color: COLORS.success };
  if (score >= 60) return { label: 'Reliable', color: COLORS.primary };
  if (score >= 40) return { label: 'Fair', color: COLORS.warning };
  return { label: 'Building up', color: COLORS.gray };
}

export default function PerformanceBadge({ performance, compact = false }: Props) {
  const score = performance?.score;

  if (score === null || score === undefined) {
    return (
      <View style={[styles.pill, styles.pillNeutral, compact && styles.pillCompact]}>
        <Text style={[styles.label, styles.labelNeutral, compact && styles.labelCompact]}>
          Building reputation
        </Text>
      </View>
    );
  }

  const band = bandFor(score);

  return (
    <View style={[styles.pill, { backgroundColor: `${band.color}1A` }, compact && styles.pillCompact]}>
      <Text style={[styles.score, { color: band.color }, compact && styles.scoreCompact]}>
        {score}
      </Text>
      <Text style={[styles.label, { color: band.color }, compact && styles.labelCompact]}>
        {band.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  pillCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  pillNeutral: {
    backgroundColor: '#ECF0F1',
  },
  score: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 5,
  },
  scoreCompact: {
    fontSize: 11,
    marginRight: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  labelCompact: {
    fontSize: 10,
  },
  labelNeutral: {
    color: COLORS.gray,
  },
});
