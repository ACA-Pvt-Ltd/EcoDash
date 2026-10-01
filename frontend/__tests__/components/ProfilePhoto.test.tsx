import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ProfilePhoto from '@/components/ProfilePhoto';
import { fetchResponse } from '../setup/apiMock';
import { lastAlert, pressAlertButton } from '../setup/alert';

let mockUser: Record<string, unknown> = { _id: 'u1', name: 'nimali', role: 'user' };
const mockUpdateUser = jest.fn();

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, token: 'test-token', updateUser: mockUpdateUser }),
}));

const picker = ImagePicker as unknown as Record<string, jest.Mock>;
const PHOTO = 'https://res.cloudinary.com/demo/image/upload/v1/ecodash/profiles/abc.jpg';
const NEW_PHOTO = 'https://res.cloudinary.com/demo/image/upload/v2/ecodash/profiles/new.jpg';
const asset = { uri: 'file:///tmp/me.jpg', mimeType: 'image/jpeg', fileName: 'me.jpg' };

const openMenu = () => fireEvent.press(screen.getByLabelText('Change profile photo'));
const menuOptions = () => lastAlert().buttons.map((b) => b.text);

beforeEach(() => {
  mockUser = { _id: 'u1', name: 'nimali', role: 'user' };
  picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
  picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });
  picker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [asset] });
  picker.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [asset] });
});

describe('ProfilePhoto', () => {
  it('shows the initial when there is no photo', () => {
    render(<ProfilePhoto />);
    expect(screen.getByText('N')).toBeTruthy();
    expect(screen.queryByTestId('profile-photo-image')).toBeNull();
  });

  it("shows the photo, including a vendor's photo returned as `logo`", () => {
    mockUser = { _id: 'v1', name: 'EcoMart', role: 'vendor', logo: PHOTO };
    render(<ProfilePhoto />);
    expect(screen.getByTestId('profile-photo-image').props.source).toEqual({ uri: PHOTO });
  });

  it('offers Remove only when there is a photo', () => {
    render(<ProfilePhoto />);
    openMenu();
    expect(menuOptions()).toEqual(['Take photo', 'Choose from library', 'Cancel']);
  });

  it('uploads a photo chosen from the library and updates the signed-in account', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => fetchResponse({ success: true, data: { profileImage: NEW_PHOTO } }));
    render(<ProfilePhoto />);
    openMenu();
    pressAlertButton('Choose from library');

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ profileImage: NEW_PHOTO, logo: NEW_PHOTO }));
    expect(picker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ allowsEditing: true, aspect: [1, 1] }));
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toMatch(/\/auth\/profile-photo$/);
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer test-token');
    expect(init.body).toBeInstanceOf(FormData);
  });

  it('can take a photo with the camera', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => fetchResponse({ success: true, data: { profileImage: NEW_PHOTO } }));
    render(<ProfilePhoto />);
    openMenu();
    pressAlertButton('Take photo');
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalled());
    expect(picker.launchCameraAsync).toHaveBeenCalled();
  });

  it('explains when photo access is denied and uploads nothing', async () => {
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });
    render(<ProfilePhoto />);
    openMenu();
    pressAlertButton('Choose from library');
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Photo access needed', expect.stringContaining('settings')));
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('does nothing when the picker is cancelled', async () => {
    picker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
    render(<ProfilePhoto />);
    openMenu();
    pressAlertButton('Choose from library');
    await waitFor(() => expect(picker.launchImageLibraryAsync).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("shows the server's message when the upload fails", async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      fetchResponse({ success: false, message: 'That photo is too large. Please choose one under 5 MB.' }, { ok: false, status: 400 })
    );
    render(<ProfilePhoto />);
    openMenu();
    pressAlertButton('Choose from library');
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't update photo", 'That photo is too large. Please choose one under 5 MB.'));
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('removes the photo', async () => {
    mockUser = { _id: 'u1', name: 'nimali', role: 'user', profileImage: PHOTO };
    (global.fetch as jest.Mock).mockImplementation(() => fetchResponse({ success: true, data: { profileImage: null } }));
    render(<ProfilePhoto />);
    openMenu();
    expect(menuOptions()).toContain('Remove photo');
    pressAlertButton('Remove photo');
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ profileImage: null, logo: null }));
    expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('DELETE');
  });
});
