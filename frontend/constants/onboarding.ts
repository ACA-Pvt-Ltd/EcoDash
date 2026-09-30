import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/**
 * First-run guide shown once per account (see hooks/useFirstRunGuide.ts) and
 * replayable from Profile → App guide. Wording refers to the real tab names,
 * so update it here when tabs or flows change.
 */
export interface GuideSlide {
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  body: string;
}

export type GuideRole = 'user' | 'collector' | 'vendor';

export const GUIDE_SLIDES: Record<GuideRole, GuideSlide[]> = {
  user: [
    {
      icon: 'leaf',
      color: '#2ECC71',
      title: 'Welcome to EcoDash',
      body: 'Turn waste into worth. Sell your recyclables to local collectors and earn points and cash for every kilo.',
    },
    {
      icon: 'pricetags',
      color: '#3498DB',
      title: 'List your waste',
      body: 'Go to Offers → Create Offer. Pick the waste type, add photos, the weight and your city, and set your price.',
    },
    {
      icon: 'chatbubbles',
      color: '#9B59B6',
      title: 'Collectors come to you',
      body: 'Collectors send you purchase requests. Accept or reject them in Requests. Chat and Call open as soon as a collector has sent a request.',
    },
    {
      icon: 'qr-code',
      color: '#16874A',
      title: 'Drop off with your QR code',
      body: 'Taking waste to a collector? Open Profile → Show My QR Code. They scan it and the points or cash go straight to your account.',
    },
    {
      icon: 'map',
      color: '#E67E22',
      title: 'Find collection points',
      body: 'The Map shows verified collectors near you and the waste types each one accepts.',
    },
    {
      icon: 'gift',
      color: '#E74C3C',
      title: 'Spend your points',
      body: 'Redeem points for vendor rewards in Rewards. Need help? Help & Support is in your Profile.',
    },
  ],
  collector: [
    {
      icon: 'leaf',
      color: '#2ECC71',
      title: 'Welcome, collector',
      body: 'Buy waste from households, record drop-offs, and sell what you collect to vendors — all from the tabs below.',
    },
    {
      icon: 'people',
      color: '#3498DB',
      title: 'Find waste in User Offers',
      body: 'Browse what people near you are selling. Use the filter button to narrow by province, city, category and weight.',
    },
    {
      icon: 'call',
      color: '#9B59B6',
      title: 'Request, then chat or call',
      body: 'Open an offer and tap Request to Buy. Chat and Call unlock once your request is sent, so you can arrange the pickup.',
    },
    {
      icon: 'scan',
      color: '#16874A',
      title: 'Scan QR for drop-offs',
      body: 'When someone brings waste to you, use Scan QR on their code, enter the weight, and award points or cash.',
    },
    {
      icon: 'storefront',
      color: '#E67E22',
      title: 'Sell to vendors',
      body: 'List collected waste in My Offers for vendors to buy, and follow your purchase requests in My Requests.',
    },
    {
      icon: 'help-circle',
      color: '#E74C3C',
      title: 'Keep your profile current',
      body: 'Up-to-date hours and waste types help people find you. Help & Support is in your Profile.',
    },
  ],
  vendor: [
    {
      icon: 'leaf',
      color: '#2ECC71',
      title: 'Welcome, vendor',
      body: 'Buy sorted waste directly from collectors and manage your stock and prices in one place.',
    },
    {
      icon: 'cart',
      color: '#3498DB',
      title: 'Browse collector offers',
      body: 'Offers lists waste collectors are selling. Tap Filters to narrow by province, city, category and weight.',
    },
    {
      icon: 'call',
      color: '#9B59B6',
      title: 'Purchase, then chat or call',
      body: 'Open an offer and make a purchase request. Chat and Call unlock once your request is made, so you can agree the details.',
    },
    {
      icon: 'receipt',
      color: '#16874A',
      title: 'Track your purchases',
      body: 'Switch to My Purchases on the Offers tab to see which requests are pending, accepted or completed.',
    },
    {
      icon: 'cash',
      color: '#E67E22',
      title: 'Prices and stock',
      body: 'Set what you pay per kilo in Pricing, and see everything you have bought in Inventory.',
    },
    {
      icon: 'help-circle',
      color: '#E74C3C',
      title: "You're all set",
      body: 'You can replay this guide any time from Profile → App guide. Help & Support is there too.',
    },
  ],
};

export const guideSlidesFor = (role?: string): GuideSlide[] =>
  GUIDE_SLIDES[(role as GuideRole) in GUIDE_SLIDES ? (role as GuideRole) : 'user'];

export const ROLE_HOME: Record<GuideRole, string> = {
  user: '/(tabs)',
  collector: '/(collector-tabs)',
  vendor: '/(vendor-tabs)',
};
