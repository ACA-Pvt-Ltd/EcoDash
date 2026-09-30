import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import OfferFilters from '@/components/OfferFilters';
import {
  EMPTY_OFFER_FILTERS,
  filterOffers,
  type OfferFilterState,
  type OfferGetters,
} from '@/utils/offerFilters';

interface Offer { id: string; city: string; wasteType: string; quantity: { value: number; unit: string } }

const OFFERS: Offer[] = [
  { id: 'a', city: 'Colombo', wasteType: 'Plastic', quantity: { value: 50, unit: 'kg' } },
  { id: 'b', city: 'Negombo', wasteType: 'Paper', quantity: { value: 300, unit: 'kg' } },
  { id: 'c', city: 'Kandy', wasteType: 'Plastic', quantity: { value: 800, unit: 'kg' } },
  { id: 'd', city: 'Galle', wasteType: 'Glass', quantity: { value: 2, unit: 'bags' } },
];

const GETTERS: OfferGetters<Offer> = {
  city: o => o.city,
  wasteType: o => o.wasteType,
  quantity: o => o.quantity,
};

/** Renders the panel the way a screen does and prints which offers are visible. */
function Harness() {
  const [filters, setFilters] = useState<OfferFilterState>(EMPTY_OFFER_FILTERS);
  const visible = filterOffers(OFFERS, filters, GETTERS).map(o => o.id).join(',');
  return (
    <>
      <OfferFilters offers={OFFERS} getters={GETTERS} filters={filters} onChange={setFilters} />
      <Text testID="visible">{visible || 'none'}</Text>
    </>
  );
}

const visible = () => screen.getByTestId('visible').props.children;
const tap = (label: string | RegExp) => fireEvent.press(screen.getByText(label));

describe('OfferFilters', () => {
  beforeEach(() => render(<Harness />));

  it('lists provinces and cities present in the offers, with counts', () => {
    expect(screen.getByText('Western (2)')).toBeTruthy();
    expect(screen.getByText('Central (1)')).toBeTruthy();
    expect(screen.getByText('Southern (1)')).toBeTruthy();
    expect(screen.getByText('Colombo (1)')).toBeTruthy();
    expect(screen.getByText('Galle (1)')).toBeTruthy();
    expect(visible()).toBe('a,b,c,d');
  });

  it('filters by province and narrows the city list to that province', () => {
    tap('Western (2)');
    expect(visible()).toBe('a,b');
    expect(screen.getByText('Negombo (1)')).toBeTruthy();
    expect(screen.queryByText('Kandy (1)')).toBeNull();
  });

  it('resets the city when the province changes', () => {
    tap('Colombo (1)');
    expect(visible()).toBe('a');
    tap('Central (1)');
    expect(visible()).toBe('c'); // not "none": the Colombo city filter was cleared
  });

  it('filters by category and weight together', () => {
    tap('Plastic');
    expect(visible()).toBe('a,c');
    tap('500+ kg');
    expect(visible()).toBe('c');
    expect(screen.getByText(/Only offers measured in kg/)).toBeTruthy();
  });

  it('hides non-kg offers once a weight range is picked', () => {
    tap('0–100 kg');
    expect(visible()).toBe('a');
  });

  it('Clear all resets every filter and then hides itself', () => {
    expect(screen.queryByText('Clear all')).toBeNull();
    tap('Western (2)');
    tap('Paper');
    expect(visible()).toBe('b');
    tap('Clear all');
    expect(visible()).toBe('a,b,c,d');
    expect(screen.queryByText('Clear all')).toBeNull();
  });
});
