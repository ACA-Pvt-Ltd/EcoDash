import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Exercises the real interceptors registered in services/api.ts rather than a
 * stubbed copy, by invoking the handlers axios stored on the instance.
 */
const reqHandler = (api.interceptors.request as any).handlers[0];
const resHandler = (api.interceptors.response as any).handlers[0];

const httpError = (status: number, data: unknown = { success: false, message: 'nope' }) => ({
  response: { status, data },
  message: `Request failed with status code ${status}`,
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('request interceptor', () => {
  it('attaches the stored token as a bearer header', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, 'stored-token-abc');

    const config = await reqHandler.fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer stored-token-abc');
  });

  it('sends no Authorization header when no token is stored', async () => {
    const config = await reqHandler.fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('reads the token from storage on every request, not from a cached value', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, 'first-token');
    const first = await reqHandler.fulfilled({ headers: {} });
    expect(first.headers.Authorization).toBe('Bearer first-token');

    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, 'second-token');
    const second = await reqHandler.fulfilled({ headers: {} });
    expect(second.headers.Authorization).toBe('Bearer second-token');
  });
});

describe('response interceptor - success', () => {
  it('unwraps the axios envelope and returns response.data directly', () => {
    const body = { success: true, data: { points: 10 } };

    const result = resHandler.fulfilled({ data: body, status: 200, headers: {} });

    // Callers receive the backend envelope, NOT an AxiosResponse
    expect(result).toBe(body);
    expect((result as any).status).toBeUndefined();
  });
});

describe('response interceptor - failure', () => {
  it('clears all three auth keys on a 401', async () => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.TOKEN, 't'],
      [STORAGE_KEYS.USER, '{"_id":"1"}'],
      [STORAGE_KEYS.USER_ROLE, 'user'],
    ]);

    await expect(resHandler.rejected(httpError(401))).rejects.toBeDefined();

    expect(await AsyncStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE)).toBeNull();
  });

  it('leaves stored auth intact for non-401 errors', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, 'keep-me');

    await expect(resHandler.rejected(httpError(500))).rejects.toBeDefined();

    expect(await AsyncStorage.getItem(STORAGE_KEYS.TOKEN)).toBe('keep-me');
  });

  it('rejects with the response body for an HTTP error, not an Error instance', async () => {
    const body = { success: false, message: 'Invalid credentials' };

    await expect(resHandler.rejected(httpError(400, body))).rejects.toEqual(body);
    await expect(resHandler.rejected(httpError(400, body))).rejects.not.toBeInstanceOf(Error);
  });

  it('rejects with a bare string for a network failure, so `.message` is undefined', async () => {
    // This is why network failures surface to users as the generic fallback
    // text: there is no `.message` to read off a string.
    const networkFailure = { message: 'timeout of 10000ms exceeded' };

    await expect(resHandler.rejected(networkFailure)).rejects.toBe(
      'timeout of 10000ms exceeded'
    );
    await expect(
      resHandler.rejected(networkFailure).catch((e: any) => e?.message)
    ).resolves.toBeUndefined();
  });

  it('a 401 clears storage but cannot tell AuthContext — documented session bug', async () => {
    // Regression guard for the reported (unfixed) issue: after this rejection
    // the app still holds user/token in React state. If a future change wires
    // a logout bridge, this test should be updated deliberately.
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, 't');

    await expect(resHandler.rejected(httpError(401))).rejects.toBeDefined();

    expect(await AsyncStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
  });
});

describe('instance configuration', () => {
  it('uses a bounded timeout so requests cannot hang forever', () => {
    expect(api.defaults.timeout).toBe(10000);
  });

  it('points at the configured API base URL', () => {
    expect(api.defaults.baseURL).toContain('/api');
  });
});
