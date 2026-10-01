import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from '@/context/LanguageContext';

/**
 * Compact EN · සිං · தமி pills for the welcome and login screens, so people can
 * pick a language before signing in. `dark` suits a coloured background.
 */
export function LanguagePills({ dark = false }: { dark?: boolean }) {
  const { language, setLanguage, languages } = useTranslation();
  return (
    <View style={[styles.pills, dark && styles.pillsDark]} accessibilityRole="radiogroup">
      {languages.map((l) => {
        const active = l.code === language;
        return (
          <TouchableOpacity
            key={l.code}
            onPress={() => setLanguage(l.code)}
            style={[styles.pill, active && (dark ? styles.pillActiveDark : styles.pillActive)]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={l.name}
          >
            <Text style={[styles.pillText, dark && styles.pillTextDark, active && (dark ? styles.pillTextActiveDark : styles.pillTextActive)]}>
              {l.short}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Opens a picker with the three languages, each shown in its own script. */
export function useLanguagePicker() {
  const { t, setLanguage, languages, language } = useTranslation();
  return () =>
    Alert.alert(t('common.chooseLanguage'), undefined, [
      ...languages.map((l) => ({
        text: l.code === language ? `${l.name} ✓` : l.name,
        onPress: () => setLanguage(l.code),
      })),
      { text: t('common.cancel'), style: 'cancel' as const },
    ]);
}

/** Name of the current language in its own script, for the Profile "Language" row. */
export function useCurrentLanguageName() {
  const { language, languages } = useTranslation();
  return languages.find((l) => l.code === language)?.name ?? 'English';
}

const styles = StyleSheet.create({
  pills: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    backgroundColor: '#F1F3F5',
    borderRadius: 18,
    padding: 3,
    gap: 2,
  },
  pillsDark: { backgroundColor: 'rgba(255,255,255,0.18)' },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  pillActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  pillActiveDark: { backgroundColor: '#FFFFFF' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#7F8C8D' },
  pillTextDark: { color: 'rgba(255,255,255,0.85)' },
  pillTextActive: { color: '#16874A', fontWeight: '800' },
  pillTextActiveDark: { color: '#16874A', fontWeight: '800' },
});
