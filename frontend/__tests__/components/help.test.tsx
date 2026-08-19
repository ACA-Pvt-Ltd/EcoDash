import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import HelpScreen from '@/app/help';

const mockBack = jest.fn();
let mockUser: Record<string, unknown> | null = { _id: 'u1', role: 'user' };
let mockConfig: Record<string, unknown> = {};

jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock('@/context/AppConfigContext', () => ({
  useAppConfig: () => mockConfig,
}));

const faq = [
  { id: 'a', role: 'all', question: 'What is EcoDash?', answer: 'A recycling platform.' },
  { id: 'u', role: 'user', question: 'What is my QR code?', answer: 'It identifies you.' },
  { id: 'c', role: 'collector', question: 'How do I record a collection?', answer: 'Scan the QR.' },
  { id: 'v', role: 'vendor', question: 'How do I buy waste?', answer: 'Browse offers.' },
];

const contact = {
  email: 'support@ecodash.lk',
  phone: '+94 11 234 5678',
  whatsapp: '+94 77 123 4567',
  hours: 'Mon-Fri',
};

beforeEach(() => {
  mockUser = { _id: 'u1', role: 'user' };
  mockConfig = { faqItems: faq, supportContact: contact };
});

describe('Help screen', () => {
  describe('role filtering', () => {
    it('shows general questions plus the ones for the signed-in role', () => {
      render(<HelpScreen />);

      expect(screen.getByText('What is EcoDash?')).toBeTruthy();
      expect(screen.getByText('What is my QR code?')).toBeTruthy();
      expect(screen.queryByText('How do I record a collection?')).toBeNull();
      expect(screen.queryByText('How do I buy waste?')).toBeNull();
    });

    it('shows collector questions to a collector', () => {
      mockUser = { _id: 'c1', role: 'collector' };

      render(<HelpScreen />);

      expect(screen.getByText('How do I record a collection?')).toBeTruthy();
      expect(screen.queryByText('What is my QR code?')).toBeNull();
    });

    it('shows vendor questions to a vendor', () => {
      mockUser = { _id: 'v1', role: 'vendor' };

      render(<HelpScreen />);

      expect(screen.getByText('How do I buy waste?')).toBeTruthy();
    });

    it('still shows the general questions when nobody is signed in', () => {
      mockUser = null;

      render(<HelpScreen />);

      expect(screen.getByText('What is EcoDash?')).toBeTruthy();
    });

    it('ignores an entry whose role is not recognised', () => {
      mockConfig = {
        faqItems: [...faq, { id: 'x', role: 'admin', question: 'Secret', answer: 'Hidden' }],
        supportContact: contact,
      };

      render(<HelpScreen />);

      expect(screen.queryByText('Secret')).toBeNull();
    });
  });

  describe('accordion', () => {
    it('hides answers until a question is tapped', () => {
      render(<HelpScreen />);

      expect(screen.queryByText('A recycling platform.')).toBeNull();

      fireEvent.press(screen.getByText('What is EcoDash?'));

      expect(screen.getByText('A recycling platform.')).toBeTruthy();
    });

    it('collapses a question when tapped again', () => {
      render(<HelpScreen />);

      fireEvent.press(screen.getByText('What is EcoDash?'));
      fireEvent.press(screen.getByText('What is EcoDash?'));

      expect(screen.queryByText('A recycling platform.')).toBeNull();
    });

    it('keeps only one answer open at a time', () => {
      render(<HelpScreen />);

      fireEvent.press(screen.getByText('What is EcoDash?'));
      fireEvent.press(screen.getByText('What is my QR code?'));

      expect(screen.queryByText('A recycling platform.')).toBeNull();
      expect(screen.getByText('It identifies you.')).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('explains when no questions are published', () => {
      mockConfig = { faqItems: [], supportContact: contact };

      render(<HelpScreen />);

      expect(screen.getByText(/No questions have been published yet/i)).toBeTruthy();
    });

    it('still offers contact details when there are no questions', () => {
      mockConfig = { faqItems: [], supportContact: contact };

      render(<HelpScreen />);

      expect(screen.getByText('support@ecodash.lk')).toBeTruthy();
    });
  });

  describe('contact actions', () => {
    it('opens the mail app for the support email', () => {
      render(<HelpScreen />);

      fireEvent.press(screen.getByText('support@ecodash.lk'));

      expect(Linking.canOpenURL).toHaveBeenCalledWith('mailto:support@ecodash.lk');
    });

    it('strips spaces from the phone number when dialling', () => {
      render(<HelpScreen />);

      fireEvent.press(screen.getByText('+94 11 234 5678'));

      expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:+94112345678');
    });

    it('hides contact rows that are not configured', () => {
      mockConfig = {
        faqItems: faq,
        supportContact: { email: 'support@ecodash.lk', phone: '' },
      };

      render(<HelpScreen />);

      expect(screen.getByText('support@ecodash.lk')).toBeTruthy();
      expect(screen.queryByText('+94 11 234 5678')).toBeNull();
    });
  });

  describe('navigation', () => {
    it('goes back when the back arrow is pressed', () => {
      render(<HelpScreen />);

      fireEvent.press(screen.getByText('Help & Support').parent!.parent!.children[0] as never);

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
