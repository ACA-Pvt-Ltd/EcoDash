import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/config';
import { useAppConfig } from '@/context/AppConfigContext';
import {
  EMPTY_OFFER_FILTERS,
  WEIGHT_RANGES,
  activeFilterCount,
  buildOfferOptions,
  type OfferFilterState,
  type OfferGetters,
} from '@/utils/offerFilters';

interface Props<T> {
  offers: T[];
  getters: OfferGetters<T>;
  filters: OfferFilterState;
  onChange: (filters: OfferFilterState) => void;
}

/** Province / city / category / weight chip rows for the offer browse screens. */
export default function OfferFilters<T>({ offers, getters, filters, onChange }: Props<T>) {
  const { wasteCategories } = useAppConfig();
  const { provinces, cities } = useMemo(
    () => buildOfferOptions(offers, getters, filters.province),
    [offers, getters, filters.province]
  );

  const set = (patch: Partial<OfferFilterState>) => onChange({ ...filters, ...patch });

  return (
    <View style={styles.panel}>
      <View style={styles.titleRow}>
        <Text style={styles.panelTitle}>Filter offers</Text>
        {activeFilterCount(filters) > 0 && (
          <TouchableOpacity onPress={() => onChange(EMPTY_OFFER_FILTERS)} hitSlop={8}>
            <Text style={styles.clear}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Province</Text>
      <ChipRow>
        <Chip label="All" active={filters.province === 'all'} onPress={() => set({ province: 'all', city: 'all' })} />
        {provinces.map(p => (
          <Chip
            key={p.value}
            label={`${p.label} (${p.count})`}
            active={filters.province === p.value}
            // Changing province resets the city, which may not be in the new province
            onPress={() => set({ province: p.value, city: 'all' })}
          />
        ))}
      </ChipRow>

      <Text style={styles.label}>City</Text>
      <ChipRow>
        <Chip label="All" active={filters.city === 'all'} onPress={() => set({ city: 'all' })} />
        {cities.map(c => (
          <Chip key={c.value} label={`${c.label} (${c.count})`} active={filters.city === c.value} onPress={() => set({ city: c.value })} />
        ))}
      </ChipRow>

      <Text style={styles.label}>Category</Text>
      <ChipRow>
        <Chip label="All" active={!filters.wasteType} onPress={() => set({ wasteType: '' })} />
        {wasteCategories.map(type => {
          const active = filters.wasteType === type.value;
          return (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, active && { backgroundColor: type.color + '25', borderColor: type.color }]}
              onPress={() => set({ wasteType: type.value })}
            >
              <Text style={{ fontSize: 14 }}>{type.icon}</Text>
              <Text style={[styles.chipText, active && { color: type.color, fontWeight: '700' }]}>{type.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ChipRow>

      <Text style={styles.label}>Weight</Text>
      <ChipRow>
        {WEIGHT_RANGES.map(w => (
          <Chip key={w.value} label={w.label} active={filters.weight === w.value} onPress={() => set({ weight: w.value })} />
        ))}
      </ChipRow>
      {filters.weight !== 'any' && <Text style={styles.hint}>Only offers measured in kg are shown.</Text>}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {children}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Small count badge for a screen's filter button. */
export function FilterCountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  panelTitle: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  clear: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  label: { fontSize: 11, fontWeight: '700', color: '#95A5A6', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 10, marginBottom: 6 },
  chipRow: { paddingRight: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, color: '#7F8C8D', fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  hint: { fontSize: 11, color: '#95A5A6', marginTop: 6 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
