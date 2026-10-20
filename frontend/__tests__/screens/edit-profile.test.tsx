import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import EditProfileScreen from '@/app/edit-profile';
import api from '@/services/api';
import { lastAlert, pressAlertButton } from '../setup/alert';
import { WASTE_TYPES } from '@/constants/config';

let mockUser: Record<string, any> = {};
let mockFresh: Record<string, any> | null;
const mockUpdateUser = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    updateUser: mockUpdateUser,
    refreshUser: jest.fn(() => Promise.resolve(mockFresh)),
  }),
}));

jest.mock('@/context/AppConfigContext', () => ({
  useAppConfig: () => ({ wasteCategories: jest.requireActual('@/constants/config').WASTE_TYPES }),
}));

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: { put: jest.fn() },
}));

const mockedApi = api as unknown as { put: jest.Mock };
const mockedRouter = router as unknown as { back: jest.Mock };

const USER = {
  _id: 'u1', role: 'user', name: 'Nimali Perera', email: 'nimali@test.dev', phone: '0771234567',
  address: { street: '12 Lake Rd', city: 'Kandy', state: 'Central' },
};
const COLLECTOR = {
  _id: 'c1', role: 'collector', name: 'Green Collect', email: 'green@test.dev', phone: '0712222222',
  address: { city: 'Colombo' }, description: 'We pick up plastic', acceptedWasteTypes: ['Plastic', 'Metal'],
};
const VENDOR = {
  _id: 'v1', role: 'vendor', name: 'EcoMart', email: 'eco@test.dev', phone: '0113333333',
  businessType: 'Online', description: 'Recycler', website: 'https://ecomart.lk',
};

const save = () => fireEvent.press(screen.getByText('Save changes'));
const value = (label: string) => screen.getByLabelText(label).props.value;

const renderFor = async (u: Record<string, any>, fresh: Record<string, any> | null = u) => {
  // Sign-in data has no address; the full profile comes from refreshUser()
  mockUser = { ...u, address: undefined };
  mockFresh = fresh;
  render(<EditProfileScreen />);
  if (fresh?.address?.city) await waitFor(() => expect(value('City')).toBe(fresh.address.city));
  else await waitFor(() => expect(value('Name')).toBe(u.name));
};

describe('Edit profile screen', () => {
  it('pre-fills a user with the latest details, including the address, and shows only personal fields', async () => {
    await renderFor(USER);
    expect(value('Name')).toBe('Nimali Perera');
    expect(value('Phone')).toBe('0771234567');
    expect(value('Street')).toBe('12 Lake Rd');
    expect(value('Province')).toBe('Central');
    expect(screen.getByLabelText('Email').props.editable).toBe(false);
    expect(screen.queryByText('Waste types you accept')).toBeNull();
    expect(screen.queryByText('Business type')).toBeNull();
    expect(screen.queryByLabelText('About')).toBeNull();
  });

  it('still works with the stored details when the refresh fails', async () => {
    await renderFor(USER, null);
    expect(value('Name')).toBe('Nimali Perera');
    expect(value('City')).toBe('');
  });

  it('saves a user to /auth/update-profile, updates the signed-in account and goes back', async () => {
    const saved = { ...USER, name: 'Nimali P' };
    mockedApi.put.mockResolvedValue({ success: true, data: saved });
    await renderFor(USER);
    fireEvent.changeText(screen.getByLabelText('Name'), '  Nimali P  ');
    save();

    await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/auth/update-profile', {
      name: 'Nimali P',
      phone: '0771234567',
      address: { street: '12 Lake Rd', city: 'Kandy', state: 'Central' },
    }));
    expect(mockUpdateUser).toHaveBeenCalledWith(saved);
    await waitFor(() => expect(lastAlert().title).toBe('Profile updated'));
    pressAlertButton('OK');
    expect(mockedRouter.back).toHaveBeenCalled();
  });

  it.each([
    ['name', 'Name', 'Please enter your name'],
    ['phone', 'Phone', 'Please enter your phone number'],
  ])('requires a %s before calling the API', async (_n, label, message) => {
    await renderFor(USER);
    fireEvent.changeText(screen.getByLabelText(label), '   ');
    save();
    expect(Alert.alert).toHaveBeenCalledWith("Couldn't save", message);
    expect(mockedApi.put).not.toHaveBeenCalled();
  });

  it("shows the server's message when saving fails", async () => {
    mockedApi.put.mockRejectedValue({ success: false, message: "Phone can't be empty" });
    await renderFor(USER);
    save();
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Couldn't save", "Phone can't be empty"));
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockedRouter.back).not.toHaveBeenCalled();
  });

  it('lets a collector change accepted waste types and saves to /collectors/profile', async () => {
    mockedApi.put.mockResolvedValue({ success: true, data: COLLECTOR });
    await renderFor(COLLECTOR);
    expect(value('About')).toBe('We pick up plastic');
    expect(screen.getAllByRole('checkbox')).toHaveLength(WASTE_TYPES.length);

    fireEvent.press(screen.getByText('🔩 Metal'));
    fireEvent.press(screen.getByText('📄 Paper'));
    save();

    await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/collectors/profile', expect.objectContaining({
      acceptedWasteTypes: ['Plastic', 'Paper'],
      description: 'We pick up plastic',
      address: { street: '', city: 'Colombo', state: '' },
    })));
    expect(mockedApi.put.mock.calls[0][1]).not.toHaveProperty('businessType');
  });

  it('requires a collector to keep at least one waste type', async () => {
    await renderFor(COLLECTOR);
    fireEvent.press(screen.getByText('♻️ Plastic'));
    fireEvent.press(screen.getByText('🔩 Metal'));
    save();
    expect(Alert.alert).toHaveBeenCalledWith("Couldn't save", 'Choose at least one waste type you accept');
    expect(mockedApi.put).not.toHaveBeenCalled();
  });

  it('lets a vendor change business type and website and saves to /vendors/profile', async () => {
    mockedApi.put.mockResolvedValue({ success: true, data: VENDOR });
    await renderFor(VENDOR);
    expect(value('Website')).toBe('https://ecomart.lk');
    expect(screen.queryByText('Waste types you accept')).toBeNull();

    fireEvent.press(screen.getByText('Both'));
    fireEvent.changeText(screen.getByLabelText('Website'), '');
    save();

    await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/vendors/profile', expect.objectContaining({
      businessType: 'Both',
      website: '',
      description: 'Recycler',
    })));
    expect(mockedApi.put.mock.calls[0][1]).not.toHaveProperty('acceptedWasteTypes');
  });
});
