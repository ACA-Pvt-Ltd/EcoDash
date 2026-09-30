import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import ChangePasswordScreen from '@/app/change-password';
import api from '@/services/api';
import { lastAlert, pressAlertButton } from '../setup/alert';

const mockLogout = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'c1', email: 'cal@test.dev', role: 'collector' }, logout: mockLogout }),
}));

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { put: jest.fn() },
}));

const mockedApi = api as unknown as { put: jest.Mock };
const mockedRouter = router as unknown as { back: jest.Mock; replace: jest.Mock };

const fill = (current: string, next: string, confirm: string) => {
  fireEvent.changeText(screen.getByLabelText('Current password'), current);
  fireEvent.changeText(screen.getByLabelText('New password'), next);
  fireEvent.changeText(screen.getByLabelText('Confirm new password'), confirm);
};
const submit = () => fireEvent.press(screen.getAllByText('Change Password').at(-1)!);

describe('Change password screen', () => {
  beforeEach(() => render(<ChangePasswordScreen />));

  it.each([
    ['all fields are required', ['', '', ''], 'Please fill in all fields'],
    ['new password is too short', ['oldpass1', '123', '123'], 'New password must be at least 6 characters'],
    ['new passwords must match', ['oldpass1', 'newpass1', 'newpass2'], 'New passwords do not match'],
    ['new password must differ', ['oldpass1', 'oldpass1', 'oldpass1'], 'New password must be different from your current password'],
  ])('checks that %s before calling the API', (_name, [c, n, k], message) => {
    fill(c, n, k);
    submit();
    expect(Alert.alert).toHaveBeenCalledWith('Error', message);
    expect(mockedApi.put).not.toHaveBeenCalled();
  });

  it('changes the password and goes back', async () => {
    mockedApi.put.mockResolvedValue({ success: true, message: 'Password changed successfully' });
    fill('oldpass1', 'newpass1', 'newpass1');
    submit();

    await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'oldpass1',
      newPassword: 'newpass1',
    }));
    await waitFor(() => expect(lastAlert().title).toBe('Password changed'));
    pressAlertButton('OK');
    expect(mockedRouter.back).toHaveBeenCalled();
  });

  it("shows the server's message and does not sign the user out", async () => {
    // Shaped like the axios interceptor's rejection for an HTTP error
    mockedApi.put.mockRejectedValue({ success: false, message: 'Current password is incorrect' });
    fill('wrongpass', 'newpass1', 'newpass1');
    submit();

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'Current password is incorrect'));
    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockedRouter.back).not.toHaveBeenCalled();
  });

  it('sends people who forgot their password to the emailed-code reset, pre-filled', async () => {
    fireEvent.press(screen.getByText('Forgot your current password?'));
    expect(lastAlert().title).toBe('Reset your password?');
    expect(lastAlert().message).toContain('cal@test.dev');

    pressAlertButton('Continue');

    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    await waitFor(() => expect(mockedRouter.replace).toHaveBeenCalledWith({
      pathname: '/(auth)/forgot-password',
      params: { email: 'cal@test.dev', role: 'collector' },
    }));
  });

  it('does nothing if the reset is cancelled', () => {
    fireEvent.press(screen.getByText('Forgot your current password?'));
    pressAlertButton('Cancel');
    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });
});
