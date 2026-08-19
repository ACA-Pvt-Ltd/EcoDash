/**
 * The app talks to the backend two ways, and both must be faked accurately:
 *
 *  1. services/api.ts (axios) — its response interceptor returns `response.data`
 *     directly, and rejects with `error.response?.data || error.message`, which
 *     is a plain object or a plain STRING, never an Error. Tests that reject
 *     with `new Error(...)` would not reproduce production behaviour.
 *  2. global fetch — called directly by 6+ screens, returning a Response-like
 *     object whose .json() yields the envelope.
 */

/** Rejection shaped exactly like the axios interceptor produces for an HTTP error. */
export const apiHttpError = (body: { success: false; message: string }) =>
  Promise.reject(body);

/** Rejection shaped exactly like the interceptor produces for a network/timeout failure. */
export const apiNetworkError = (message = 'Network Error') =>
  Promise.reject(message);

/** A fetch Response stand-in. */
export const fetchResponse = (
  body: unknown,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {}
) =>
  Promise.resolve({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response);

/** Queue one fetch result for the next call. */
export const mockFetchOnce = (
  body: unknown,
  opts?: { ok?: boolean; status?: number }
) => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    fetchResponse(body, opts)
  );
};

/** Queue results for consecutive fetch calls, in order. */
export const mockFetchSequence = (bodies: unknown[]) => {
  bodies.forEach((b) => mockFetchOnce(b));
};

/** Make the next fetch fail the way a dropped connection does. */
export const mockFetchNetworkFailure = (message = 'Network request failed') => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.reject(new TypeError(message))
  );
};

/** Make every fetch resolve with the same body until changed. */
export const mockFetchAlways = (body: unknown) => {
  (global.fetch as jest.Mock).mockImplementation(() => fetchResponse(body));
};

/**
 * A promise plus its resolver, for asserting the state of the UI *while* a
 * request is still in flight (loading states, disabled buttons, double-taps)
 * without any timers.
 */
export function deferred<T = unknown>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
