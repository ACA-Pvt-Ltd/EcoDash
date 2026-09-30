import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

/** Per-account flag, so a second account on the same phone still gets its own guide. */
export const GUIDE_SEEN_KEY = (userId: string) => `@waste_app_guide_seen:${userId}`;

/** Whether this account has finished or skipped the guide. Storage errors count as seen, so nobody gets stuck in a loop. */
export async function hasSeenGuide(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(GUIDE_SEEN_KEY(userId))) === '1';
  } catch {
    return true;
  }
}

export async function markGuideSeen(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(GUIDE_SEEN_KEY(userId), '1');
  } catch {
    // Not fatal: the worst case is seeing the guide again next launch
  }
}

/**
 * Opens the onboarding guide the first time an account reaches its tabs —
 * after registering, logging in, or relaunching with a stored session.
 * Call it at the top of each role's tab layout.
 */
export function useFirstRunGuide() {
  const { user } = useAuth();
  const checkedFor = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?._id;
    if (!userId || checkedFor.current === userId) return;

    // The ref is set when the check finishes (not when it starts), so React's
    // dev double-mount can't cancel the only check that would open the guide.
    hasSeenGuide(userId).then((seen) => {
      if (checkedFor.current === userId) return;
      checkedFor.current = userId;
      if (!seen) router.push('/guide');
    });
  }, [user?._id]);
}
