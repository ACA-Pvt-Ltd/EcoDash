import { Alert, Linking } from 'react-native';
import { callPhone, dialableNumber } from '@/utils/phone';

describe('dialableNumber', () => {
  it('keeps a leading + and digits only', () => {
    expect(dialableNumber('+94 77 123-4567')).toBe('+94771234567');
    expect(dialableNumber(' (077) 123 4567 ')).toBe('0771234567');
  });
});

describe('callPhone', () => {
  let canOpen: jest.SpyInstance;
  let open: jest.SpyInstance;
  let alert: jest.SpyInstance;

  beforeEach(() => {
    canOpen = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('opens the dialer with a cleaned-up tel: link', async () => {
    await callPhone('+94 77 123-4567', 'Avi');
    expect(canOpen).toHaveBeenCalledWith('tel:+94771234567');
    expect(open).toHaveBeenCalledWith('tel:+94771234567');
    expect(alert).not.toHaveBeenCalled();
  });

  it.each([undefined, null, '', '   ', '---'])('explains when there is no usable number (%p)', async (phone) => {
    await callPhone(phone, 'Avi');
    expect(alert).toHaveBeenCalledWith('No phone number', expect.stringContaining("Avi hasn't added a phone number"));
    expect(open).not.toHaveBeenCalled();
  });

  it('shows the number when the device cannot place calls', async () => {
    canOpen.mockResolvedValue(false);
    await callPhone('077 123 4567', 'Avi');
    expect(open).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith('Calling unavailable', 'Call Avi on 077 123 4567.');
  });

  it('falls back instead of throwing when opening the dialer fails', async () => {
    open.mockRejectedValue(new Error('no dialer'));
    await expect(callPhone('0771234567', 'Avi')).resolves.toBeUndefined();
    expect(alert).toHaveBeenCalledWith('Calling unavailable', 'Call Avi on 0771234567.');
  });
});
