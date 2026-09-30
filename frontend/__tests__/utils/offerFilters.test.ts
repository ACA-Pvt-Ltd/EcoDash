import {
  EMPTY_OFFER_FILTERS,
  OTHER_PROVINCE,
  activeFilterCount,
  buildOfferOptions,
  filterOffers,
  inWeightRange,
  normalizeCity,
  provinceOf,
  type OfferGetters,
} from '@/utils/offerFilters';

interface Offer {
  id: string;
  city?: string;
  state?: string;
  wasteType: string;
  quantity: { value: number; unit: string };
}

const get: OfferGetters<Offer> = {
  city: (o) => o.city,
  state: (o) => o.state,
  wasteType: (o) => o.wasteType,
  quantity: (o) => o.quantity,
};

const kg = (value: number) => ({ value, unit: 'kg' });

const OFFERS: Offer[] = [
  { id: 'colombo-plastic-50', city: 'Colombo', wasteType: 'Plastic', quantity: kg(50) },
  { id: 'colombo-paper-300', city: 'colombo ', wasteType: 'Paper', quantity: kg(300) },
  { id: 'negombo-plastic-800', city: 'Negombo', wasteType: 'Plastic', quantity: kg(800) },
  { id: 'kandy-glass-100', city: 'Kandy', wasteType: 'Glass', quantity: kg(100) },
  { id: 'galle-plastic-bags', city: 'Galle', wasteType: 'Plastic', quantity: { value: 3, unit: 'bags' } },
  { id: 'junk-city', city: 'Bsbd', wasteType: 'Metal', quantity: kg(20) },
  { id: 'no-city', wasteType: 'Metal', quantity: kg(700) },
];

const ids = (list: Offer[]) => list.map((o) => o.id);

describe('normalizeCity', () => {
  it('ignores case, surrounding and repeated spaces', () => {
    expect(normalizeCity('  Nuwara   ELIYA ')).toBe('nuwara eliya');
    expect(normalizeCity(undefined)).toBe('');
  });
});

describe('provinceOf', () => {
  it('maps districts and towns to their province', () => {
    expect(provinceOf('Colombo')).toBe('Western');
    expect(provinceOf('negombo')).toBe('Western');
    expect(provinceOf('Kandy')).toBe('Central');
    expect(provinceOf('Galle')).toBe('Southern');
    expect(provinceOf('Jaffna')).toBe('Northern');
    expect(provinceOf('Trincomalee')).toBe('Eastern');
    expect(provinceOf('Kurunegala')).toBe('North Western');
    expect(provinceOf('Anuradhapura')).toBe('North Central');
    expect(provinceOf('Badulla')).toBe('Uva');
    expect(provinceOf('Ratnapura')).toBe('Sabaragamuwa');
  });

  it('handles spelling variants', () => {
    expect(provinceOf('  NUWARA ELIYA ')).toBe('Central');
    expect(provinceOf('Kandy City')).toBe('Central');
  });

  it('prefers an address state that names a province', () => {
    expect(provinceOf('Somewhere', 'Uva Province')).toBe('Uva');
    expect(provinceOf('Colombo', 'sabaragamuwa')).toBe('Sabaragamuwa');
  });

  it('ignores a state that is not a province', () => {
    expect(provinceOf('Kandy', 'Colombo District')).toBe('Central');
  });

  it('puts unknown or missing cities under Other', () => {
    expect(provinceOf('Bsbd')).toBe(OTHER_PROVINCE);
    expect(provinceOf(undefined)).toBe(OTHER_PROVINCE);
  });
});

describe('inWeightRange', () => {
  it('matches everything for "any", including non-kg units', () => {
    expect(inWeightRange({ value: 3, unit: 'bags' }, 'any')).toBe(true);
  });

  it('puts the 100 kg and 500 kg edges in the lower range', () => {
    expect(inWeightRange(kg(0), '0-100')).toBe(true);
    expect(inWeightRange(kg(100), '0-100')).toBe(true);
    expect(inWeightRange(kg(100), '100-500')).toBe(false);
    expect(inWeightRange(kg(100.5), '100-500')).toBe(true);
    expect(inWeightRange(kg(500), '100-500')).toBe(true);
    expect(inWeightRange(kg(500), '500+')).toBe(false);
    expect(inWeightRange(kg(501), '500+')).toBe(true);
  });

  it('excludes non-kg offers once a range is picked', () => {
    expect(inWeightRange({ value: 3, unit: 'bags' }, '0-100')).toBe(false);
    expect(inWeightRange({ value: 3, unit: 'pieces' }, '500+')).toBe(false);
  });

  it('accepts KG in any case', () => {
    expect(inWeightRange({ value: 10, unit: 'KG' }, '0-100')).toBe(true);
  });
});

describe('filterOffers', () => {
  it('returns everything with no filters', () => {
    expect(filterOffers(OFFERS, EMPTY_OFFER_FILTERS, get)).toHaveLength(OFFERS.length);
  });

  it('filters by province', () => {
    expect(ids(filterOffers(OFFERS, { ...EMPTY_OFFER_FILTERS, province: 'Western' }, get))).toEqual([
      'colombo-plastic-50',
      'colombo-paper-300',
      'negombo-plastic-800',
    ]);
    expect(ids(filterOffers(OFFERS, { ...EMPTY_OFFER_FILTERS, province: OTHER_PROVINCE }, get))).toEqual([
      'junk-city',
      'no-city',
    ]);
  });

  it('filters by city regardless of spelling', () => {
    expect(ids(filterOffers(OFFERS, { ...EMPTY_OFFER_FILTERS, city: 'colombo' }, get))).toEqual([
      'colombo-plastic-50',
      'colombo-paper-300',
    ]);
  });

  it('filters by category', () => {
    expect(ids(filterOffers(OFFERS, { ...EMPTY_OFFER_FILTERS, wasteType: 'Plastic' }, get))).toEqual([
      'colombo-plastic-50',
      'negombo-plastic-800',
      'galle-plastic-bags',
    ]);
  });

  it('filters by weight range', () => {
    expect(ids(filterOffers(OFFERS, { ...EMPTY_OFFER_FILTERS, weight: '0-100' }, get))).toEqual([
      'colombo-plastic-50',
      'kandy-glass-100',
      'junk-city',
    ]);
    expect(ids(filterOffers(OFFERS, { ...EMPTY_OFFER_FILTERS, weight: '500+' }, get))).toEqual([
      'negombo-plastic-800',
      'no-city',
    ]);
  });

  it('combines filters', () => {
    expect(
      ids(filterOffers(OFFERS, { province: 'Western', city: 'all', wasteType: 'Plastic', weight: '500+' }, get))
    ).toEqual(['negombo-plastic-800']);
    expect(filterOffers(OFFERS, { province: 'Central', city: 'all', wasteType: 'Plastic', weight: 'any' }, get)).toEqual([]);
  });
});

describe('buildOfferOptions', () => {
  it('lists provinces present in the offers, in the usual order with Other last', () => {
    const { provinces } = buildOfferOptions(OFFERS, get, 'all');
    expect(provinces).toEqual([
      { value: 'Western', label: 'Western', count: 3 },
      { value: 'Central', label: 'Central', count: 1 },
      { value: 'Southern', label: 'Southern', count: 1 },
      { value: OTHER_PROVINCE, label: OTHER_PROVINCE, count: 2 },
    ]);
  });

  it('merges city spellings and prefers the capitalised one', () => {
    const { cities } = buildOfferOptions(OFFERS, get, 'all');
    expect(cities.find((c) => c.value === 'colombo')).toEqual({ value: 'colombo', label: 'Colombo', count: 2 });
  });

  it('only lists cities in the selected province, A–Z', () => {
    const { cities } = buildOfferOptions(OFFERS, get, 'Western');
    expect(cities.map((c) => c.label)).toEqual(['Colombo', 'Negombo']);
  });

  it('leaves offers without a city out of the city list', () => {
    const { cities } = buildOfferOptions(OFFERS, get, OTHER_PROVINCE);
    expect(cities.map((c) => c.label)).toEqual(['Bsbd']);
  });
});

describe('activeFilterCount', () => {
  it('counts each filter that is set', () => {
    expect(activeFilterCount(EMPTY_OFFER_FILTERS)).toBe(0);
    expect(activeFilterCount({ province: 'Western', city: 'colombo', wasteType: 'Plastic', weight: '500+' })).toBe(4);
  });
});
