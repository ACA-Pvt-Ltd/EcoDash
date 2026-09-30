/**
 * Filtering for the offer browse screens (collector → user offers, vendor →
 * collector offers). Offers only store a city, so the province is worked out
 * from it with a Sri Lankan city/district list; an account's address.state wins
 * when it names a province. Filtering is done on the device — both screens
 * already load every available offer.
 */

export const PROVINCES = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
] as const;

export const OTHER_PROVINCE = 'Other';

// All 25 districts plus common towns, keyed by normalizeCity()
const PROVINCE_TOWNS: Record<(typeof PROVINCES)[number], string[]> = {
  Western: [
    'colombo', 'gampaha', 'kalutara', 'dehiwala', 'mount lavinia', 'dehiwala-mount lavinia', 'moratuwa',
    'sri jayawardenepura kotte', 'kotte', 'battaramulla', 'nugegoda', 'maharagama', 'kottawa', 'homagama',
    'kaduwela', 'malabe', 'kolonnawa', 'wattala', 'ja-ela', 'ja ela', 'negombo', 'katunayake', 'minuwangoda',
    'kelaniya', 'kiribathgoda', 'kadawatha', 'ragama', 'gampaha town', 'veyangoda', 'nittambuwa', 'divulapitiya',
    'panadura', 'horana', 'beruwala', 'aluthgama', 'wadduwa', 'matugama', 'bandaragama', 'piliyandala',
    'kesbewa', 'boralesgamuwa', 'rajagiriya', 'pannipitiya', 'ratmalana', 'avissawella', 'hanwella', 'padukka',
  ],
  Central: [
    'kandy', 'matale', 'nuwara eliya', 'peradeniya', 'katugastota', 'gampola', 'nawalapitiya', 'kadugannawa',
    'digana', 'kundasale', 'akurana', 'dambulla', 'sigiriya', 'ukuwela', 'rattota', 'hatton', 'talawakele',
    'nanu oya', 'ginigathhena', 'maskeliya',
  ],
  Southern: [
    'galle', 'matara', 'hambantota', 'hikkaduwa', 'ambalangoda', 'elpitiya', 'baddegama', 'karapitiya',
    'unawatuna', 'weligama', 'mirissa', 'dikwella', 'akuressa', 'kamburupitiya', 'deniyaya', 'tangalle',
    'ambalantota', 'tissamaharama', 'beliatta', 'weeraketiya',
  ],
  Northern: [
    'jaffna', 'kilinochchi', 'mannar', 'mullaitivu', 'vavuniya', 'point pedro', 'chavakachcheri', 'nallur',
    'kankesanthurai',
  ],
  Eastern: [
    'trincomalee', 'batticaloa', 'ampara', 'kalmunai', 'kattankudy', 'eravur', 'akkaraipattu', 'sammanthurai',
    'dehiattakandiya', 'kinniya', 'muttur', 'kantale', 'pottuvil', 'arugam bay',
  ],
  'North Western': [
    'kurunegala', 'puttalam', 'kuliyapitiya', 'narammala', 'pannala', 'polgahawela', 'maho', 'nikaweratiya',
    'wariyapola', 'mawathagama', 'chilaw', 'wennappuwa', 'marawila', 'nattandiya', 'dankotuwa', 'anamaduwa',
  ],
  'North Central': [
    'anuradhapura', 'polonnaruwa', 'kekirawa', 'medawachchiya', 'mihintale', 'tambuttegama', 'eppawala',
    'hingurakgoda', 'kaduruwela', 'medirigiriya',
  ],
  Uva: [
    'badulla', 'monaragala', 'moneragala', 'bandarawela', 'haputale', 'ella', 'welimada', 'mahiyanganaya',
    'passara', 'diyatalawa', 'wellawaya', 'bibile', 'buttala', 'kataragama',
  ],
  Sabaragamuwa: [
    'ratnapura', 'kegalle', 'balangoda', 'embilipitiya', 'pelmadulla', 'eheliyagoda', 'kuruwita', 'kahawatta',
    'mawanella', 'warakapola', 'rambukkana', 'ruwanwella', 'yatiyantota', 'dehiowita', 'deraniyagala',
  ],
};

const CITY_PROVINCE = new Map<string, string>(
  Object.entries(PROVINCE_TOWNS).flatMap(([province, towns]) => towns.map((t) => [t, province] as [string, string]))
);

/** "Colombo " / "COLOMBO" / "colombo" → "colombo". Empty when there's no city. */
export const normalizeCity = (city?: string | null) => (city ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/** The province an offer belongs to: address.state if it names a province, else the city lookup, else "Other". */
export function provinceOf(city?: string | null, state?: string | null): string {
  const fromState = normalizeCity(state).replace(/\s+province$/, '');
  const named = PROVINCES.find((p) => p.toLowerCase() === fromState);
  if (named) return named;
  const key = normalizeCity(city);
  return CITY_PROVINCE.get(key) ?? CITY_PROVINCE.get(key.replace(/\s+(town|city)$/, '')) ?? OTHER_PROVINCE;
}

export type WeightRange = 'any' | '0-100' | '100-500' | '500+';

export const WEIGHT_RANGES: { value: WeightRange; label: string }[] = [
  { value: 'any', label: 'Any weight' },
  { value: '0-100', label: '0–100 kg' },
  { value: '100-500', label: '100–500 kg' },
  { value: '500+', label: '500+ kg' },
];

/** Whether a quantity falls in a weight range. Ranges only match kg; "any" matches everything. */
export function inWeightRange(quantity: { value?: number; unit?: string } | undefined, range: WeightRange): boolean {
  if (range === 'any') return true;
  if (!quantity || (quantity.unit ?? '').toLowerCase() !== 'kg' || typeof quantity.value !== 'number') return false;
  const kg = quantity.value;
  if (range === '0-100') return kg >= 0 && kg <= 100;
  if (range === '100-500') return kg > 100 && kg <= 500;
  return kg > 500;
}

export interface OfferFilterState {
  province: string; // 'all' or a province name
  city: string;     // 'all' or a normalizeCity() key
  wasteType: string; // '' for all
  weight: WeightRange;
}

export const EMPTY_OFFER_FILTERS: OfferFilterState = { province: 'all', city: 'all', wasteType: '', weight: 'any' };

export const activeFilterCount = (f: OfferFilterState) =>
  Number(f.province !== 'all') + Number(f.city !== 'all') + Number(!!f.wasteType) + Number(f.weight !== 'any');

/** How to read the filterable fields from a given offer shape. */
export interface OfferGetters<T> {
  city: (offer: T) => string | null | undefined;
  state?: (offer: T) => string | null | undefined;
  wasteType: (offer: T) => string;
  quantity: (offer: T) => { value?: number; unit?: string } | undefined;
}

export function filterOffers<T>(offers: T[], filters: OfferFilterState, get: OfferGetters<T>): T[] {
  return offers.filter((o) => {
    const city = get.city(o);
    if (filters.province !== 'all' && provinceOf(city, get.state?.(o)) !== filters.province) return false;
    if (filters.city !== 'all' && normalizeCity(city) !== filters.city) return false;
    if (filters.wasteType && get.wasteType(o) !== filters.wasteType) return false;
    return inWeightRange(get.quantity(o), filters.weight);
  });
}

export interface FilterOption { value: string; label: string; count: number }

/**
 * Province and city choices that actually appear in the offers, with counts.
 * Provinces follow the usual order with "Other" last; cities are A–Z, limited
 * to the selected province, labelled with their most common spelling.
 */
export function buildOfferOptions<T>(offers: T[], get: OfferGetters<T>, province: string) {
  const provinceCounts = new Map<string, number>();
  const cities = new Map<string, { count: number; spellings: Map<string, number> }>();

  for (const o of offers) {
    const city = get.city(o);
    const p = provinceOf(city, get.state?.(o));
    provinceCounts.set(p, (provinceCounts.get(p) ?? 0) + 1);

    const key = normalizeCity(city);
    if (!key || (province !== 'all' && p !== province)) continue;
    const entry = cities.get(key) ?? { count: 0, spellings: new Map<string, number>() };
    entry.count++;
    const spelling = (city ?? '').trim().replace(/\s+/g, ' ');
    entry.spellings.set(spelling, (entry.spellings.get(spelling) ?? 0) + 1);
    cities.set(key, entry);
  }

  const provinces: FilterOption[] = [...PROVINCES, OTHER_PROVINCE]
    .filter((p) => provinceCounts.has(p))
    .map((p) => ({ value: p, label: p, count: provinceCounts.get(p)! }));

  const capitalised = (s: string) => (s[0] === s[0]?.toUpperCase() ? 0 : 1);
  const cityOptions: FilterOption[] = [...cities.entries()]
    .map(([key, { count, spellings }]) => {
      const label = [...spellings.entries()]
        .sort((a, b) => b[1] - a[1] || capitalised(a[0]) - capitalised(b[0]) || a[0].localeCompare(b[0]))[0][0];
      return { value: key, label, count };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  return { provinces, cities: cityOptions };
}
