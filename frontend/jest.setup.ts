/**
 * Global test setup: mocks every external boundary (device APIs, network,
 * third-party services) so no test can touch a real device or server.
 * Application logic is never mocked here.
 */
import { Alert, InteractionManager, Linking } from 'react-native';

// React 19 + RNTL 14 (which vendors its own test renderer) requires this flag
// explicitly, otherwise every state update logs "not configured to support act"
// and the tree never re-renders.
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// ---------------------------------------------------------------- storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ---------------------------------------------------------------- sentry
// app/_layout.tsx calls Sentry.init() at module scope
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (c: unknown) => c,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// ---------------------------------------------------------------- firebase
// services/firebase.ts calls getDatabase() at import time
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn((_db: unknown, path: string) => ({ __path: path })),
  push: jest.fn(() => Promise.resolve()),
  onValue: jest.fn(() => jest.fn()), // returns unsubscribe
  query: jest.fn((r: unknown) => r),
  orderByChild: jest.fn(),
}));

// ---------------------------------------------------------------- icons
// The real icon components load fonts asynchronously and update state after the
// test has moved on, producing act() warnings unrelated to the code under test.
// Returning the icon name renders it as an inert host component instead.
jest.mock('@expo/vector-icons', () =>
  new Proxy(
    {},
    {
      get: (_target, prop) => (prop === '__esModule' ? true : prop.toString()),
    }
  )
);

// ---------------------------------------------------------------- device APIs
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: { latitude: 6.9271, longitude: 79.8612 },
  })),
  geocodeAsync: jest.fn(async () => [{ latitude: 6.9271, longitude: 79.8612 }]),
  reverseGeocodeAsync: jest.fn(async () => [
    { street: 'Main St', city: 'Colombo', region: 'Western' },
  ]),
  Accuracy: { High: 4, Balanced: 3 },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos' },
  MediaType: { Images: 'images', Videos: 'videos' },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const MapView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ animateToRegion: jest.fn() }));
    return React.createElement('MapView', props, props.children);
  });
  return {
    __esModule: true,
    default: MapView,
    Marker: 'Marker',
    PROVIDER_GOOGLE: 'google',
    PROVIDER_DEFAULT: 'default',
  };
});

jest.mock('react-native-qrcode-svg', () => 'QRCode');

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// ---------------------------------------------------------------- react-native bits
// Screens defer state into runAfterInteractions; run it synchronously so tests
// observe the same end state without arbitrary waits.
jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((
  task: unknown
) => {
  if (typeof task === 'function') task();
  return { then: (r: () => void) => r(), done: (r: () => void) => r(), cancel: jest.fn() };
}) as never);

jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
jest.spyOn(Linking, 'canOpenURL').mockImplementation(async () => true);
jest.spyOn(Linking, 'openURL').mockImplementation(async () => true);

// ---------------------------------------------------------------- network
// Six-plus screens call fetch directly, bypassing the axios instance.
// Default: fail loudly, so a test that forgets to stub can never hit the network.
global.fetch = jest.fn(() =>
  Promise.reject(new Error('Unstubbed fetch call in test — stub it explicitly'))
) as unknown as typeof fetch;

// ---------------------------------------------------------------- hygiene
beforeEach(() => {
  (global as any).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();

  // clearAllMocks does not drop implementations or the mockImplementationOnce
  // queue, so fetch stubs would leak between tests. Reset it to the loud default.
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockImplementation(() =>
    Promise.reject(new Error('Unstubbed fetch call in test — stub it explicitly'))
  );

  (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
  (Linking.openURL as jest.Mock).mockResolvedValue(true);
});

// Surface accidental real-network or unhandled async errors instead of hiding them
afterEach(() => {
  jest.useRealTimers();
});
