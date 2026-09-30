import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants/config';
import { ROLE_HOME, guideSlidesFor, type GuideRole, type GuideSlide } from '@/constants/onboarding';
import { markGuideSeen } from '@/hooks/useFirstRunGuide';

/** Onboarding guide: opens automatically once per account, or from Profile → App guide (replay=1). */
export default function GuideScreen() {
  const { user } = useAuth();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<GuideSlide>>(null);
  const [index, setIndex] = useState(0);

  const role = (user?.role ?? 'user') as GuideRole;
  const slides = guideSlidesFor(role);
  const isLast = index === slides.length - 1;

  const finish = async () => {
    if (user?._id) await markGuideSeen(user._id);
    if (replay === '1' && router.canGoBack()) router.back();
    else router.replace((ROLE_HOME[role] ?? ROLE_HOME.user) as never);
  };

  const goTo = (next: number) => {
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== index) setIndex(Math.max(0, Math.min(page, slides.length - 1)));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Text style={styles.stepText}>
          {index + 1} of {slides.length}
        </Text>
        {!isLast && (
          <TouchableOpacity onPress={finish} hitSlop={12} accessibilityRole="button">
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconRing, { backgroundColor: item.color + '1A' }]}>
              <View style={[styles.iconCore, { backgroundColor: item.color + '26' }]}>
                <Ionicons name={item.icon} size={64} color={item.color} />
              </View>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={isLast ? finish : () => goTo(index + 1)}
          accessibilityRole="button"
        >
          <Text style={styles.nextText}>{isLast ? 'Get started' : 'Next'}</Text>
          <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    minHeight: 40,
  },
  stepText: { fontSize: 13, fontWeight: '600', color: '#95A5A6' },
  skip: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconRing: { width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  iconCore: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#2C3E50', textAlign: 'center', marginBottom: 14 },
  body: { fontSize: 16, lineHeight: 24, color: '#5D6D7E', textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D5DBDB' },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextText: { fontSize: 17, fontWeight: '700', color: '#fff' },
});
