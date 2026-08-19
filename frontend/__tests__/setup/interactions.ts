import { act, fireEvent } from '@testing-library/react-native';

// Derived from fireEvent itself so no @types/react-test-renderer is needed.
type PressTarget = Parameters<typeof fireEvent.press>[0];

/**
 * Presses an element and lets every promise the handler started settle inside
 * act(). Use this whenever the press kicks off async work — otherwise the state
 * updates that follow the await land outside act and React warns about it.
 */
export async function pressAndSettle(element: PressTarget) {
  await act(async () => {
    fireEvent.press(element);
  });
}

/** Flushes pending microtasks inside act, for work started by something else. */
export async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

/**
 * Resolves a deferred promise and lets the resulting state updates flush inside
 * act(). Without this, state written when a held-open request finally completes
 * lands outside act and React warns.
 */
export async function resolveAndSettle(resolve: () => void) {
  await act(async () => {
    resolve();
  });
}
