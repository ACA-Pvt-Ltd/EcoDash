import en from '@/locales/en.json';
import si from '@/locales/si.json';
import ta from '@/locales/ta.json';

/** Flatten nested JSON into { 'login.title': '...' }, skipping the _meta notes. */
const flatten = (node: Record<string, unknown>, prefix = ''): Record<string, string> =>
  Object.entries(node).reduce<Record<string, string>>((out, [key, value]) => {
    if (key === '_meta') return out;
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') Object.assign(out, flatten(value as Record<string, unknown>, path));
    else out[path] = value as string;
    return out;
  }, {});

const EN = flatten(en);
const LOCALES = { si: flatten(si), ta: flatten(ta) };
const SCRIPT = { si: /[඀-෿]/, ta: /[஀-௿]/ };
const placeholders = (text: string) => (text.match(/\{\{\w+\}\}/g) ?? []).sort();

describe('locale files', () => {
  it('English has text for every key', () => {
    expect(Object.keys(EN).length).toBeGreaterThan(50);
    for (const [key, value] of Object.entries(EN)) expect([key, typeof value, value.trim().length > 0]).toEqual([key, 'string', true]);
  });

  describe.each(Object.entries(LOCALES))('%s', (lang, dict) => {
    it('has exactly the same keys as English', () => {
      expect(Object.keys(dict).sort()).toEqual(Object.keys(EN).sort());
    });

    it('has no empty text', () => {
      for (const [key, value] of Object.entries(dict)) expect([key, value.trim() !== '']).toEqual([key, true]);
    });

    it('keeps every {{placeholder}} from English', () => {
      for (const key of Object.keys(EN)) expect([key, placeholders(dict[key])]).toEqual([key, placeholders(EN[key])]);
    });

    it('is written in its own script (catches English left untranslated)', () => {
      const script = SCRIPT[lang as keyof typeof SCRIPT];
      for (const [key, value] of Object.entries(dict)) expect([key, script.test(value)]).toEqual([key, true]);
    });
  });
});
