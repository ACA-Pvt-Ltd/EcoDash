import { InteractionManager } from 'react-native';

/**
 * Defer execution until after interactions/animations complete
 * Use this for non-critical operations after navigation
 */
export const runAfterInteractions = (callback: () => void): void => {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
};

/**
 * Debounce function to limit how often a function is called
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  // React Native's setTimeout returns a number, not a NodeJS.Timeout, so the
  // handle is typed from setTimeout itself rather than assumed.
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    // Compared against null explicitly: a timer id of 0 is falsy but valid, and
    // a truthiness check would skip clearing it.
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function to ensure a function is called at most once in a specified period
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Request animation frame wrapper for smooth animations
 */
export const requestAnimationFrameWrapper = (callback: () => void): void => {
  requestAnimationFrame(() => {
    callback();
  });
};
