import AsyncStorage from '@react-native-async-storage/async-storage';
import { GUIDE_SLIDES, ROLE_HOME, guideSlidesFor } from '@/constants/onboarding';
import { GUIDE_SEEN_KEY, hasSeenGuide, markGuideSeen } from '@/hooks/useFirstRunGuide';

// The real Ionicons name list: a typo would render a blank icon on the device
const ioniconNames: Record<string, number> = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

describe('GUIDE_SLIDES', () => {
  it.each(Object.keys(GUIDE_SLIDES))('%s has at least 5 complete slides with real icons', (role) => {
    const slides = GUIDE_SLIDES[role as keyof typeof GUIDE_SLIDES];
    expect(slides.length).toBeGreaterThanOrEqual(5);
    for (const s of slides) {
      expect(s.title.trim()).not.toBe('');
      expect(s.body.trim().length).toBeGreaterThan(20);
      expect(s.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(ioniconNames).toHaveProperty([s.icon]);
    }
    // Titles double as list keys
    expect(new Set(slides.map((s) => s.title)).size).toBe(slides.length);
  });

  it('picks slides by role and falls back to the user guide', () => {
    expect(guideSlidesFor('collector')).toBe(GUIDE_SLIDES.collector);
    expect(guideSlidesFor('vendor')).toBe(GUIDE_SLIDES.vendor);
    expect(guideSlidesFor(undefined)).toBe(GUIDE_SLIDES.user);
    expect(guideSlidesFor('admin')).toBe(GUIDE_SLIDES.user);
  });

  it('has a home route for every role', () => {
    expect(ROLE_HOME).toEqual({ user: '/(tabs)', collector: '/(collector-tabs)', vendor: '/(vendor-tabs)' });
  });
});

describe('guide seen flag', () => {
  beforeEach(() => AsyncStorage.clear());

  it('is unset for a new account, then set per account', async () => {
    expect(await hasSeenGuide('u1')).toBe(false);
    await markGuideSeen('u1');
    expect(await hasSeenGuide('u1')).toBe(true);
    expect(await hasSeenGuide('u2')).toBe(false); // a second account on the same phone
    expect(await AsyncStorage.getItem(GUIDE_SEEN_KEY('u1'))).toBe('1');
  });

  it('treats a storage failure as seen, so the guide never loops', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk full'));
    expect(await hasSeenGuide('u1')).toBe(true);
  });

  it('does not throw when saving fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(markGuideSeen('u1')).resolves.toBeUndefined();
  });
});
