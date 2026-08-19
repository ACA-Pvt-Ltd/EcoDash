import { debounce, throttle, runAfterInteractions } from '@/utils/performance';

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());

  it('does not call the function immediately', () => {
    const fn = jest.fn();

    debounce(fn, 100)();

    expect(fn).not.toHaveBeenCalled();
  });

  it('calls the function once after the wait elapses', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('collapses a burst of calls into a single trailing call', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the arguments of the most recent call', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('second');
  });

  it('restarts the timer on each new call', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(90);
    debounced();
    jest.advanceTimersByTime(90);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows a further call after the first has fired', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(100);
    debounced();
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  // Guards the `timeout !== null` check: with a timer id of 0 a truthiness test
  // would skip clearTimeout and let a superseded call fire.
  it('clears a pending timer even when its id is 0', () => {
    const fn = jest.fn();
    const realSetTimeout = global.setTimeout;
    const setTimeoutSpy = jest
      .spyOn(global, 'setTimeout')
      .mockImplementation(((cb: () => void, ms?: number) => {
        realSetTimeout(cb, ms);
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }) as never);
    const clearSpy = jest.spyOn(global, 'clearTimeout');

    const debounced = debounce(fn, 100);
    debounced();
    debounced();

    expect(clearSpy).toHaveBeenCalledWith(0);

    setTimeoutSpy.mockRestore();
    clearSpy.mockRestore();
  });
});

describe('throttle', () => {
  beforeEach(() => jest.useFakeTimers());

  it('calls the function immediately on the leading edge', () => {
    const fn = jest.fn();

    throttle(fn, 100)();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('drops calls made inside the throttle window', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('allows a further call once the window has elapsed', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    jest.advanceTimersByTime(100);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not queue a trailing call for work dropped inside the window', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled('a');
    throttled('b');
    jest.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('forwards arguments to the throttled function', () => {
    const fn = jest.fn();

    throttle(fn, 100)('x', 42);

    expect(fn).toHaveBeenCalledWith('x', 42);
  });
});

describe('runAfterInteractions', () => {
  it('invokes the callback', () => {
    const fn = jest.fn();

    runAfterInteractions(fn);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
