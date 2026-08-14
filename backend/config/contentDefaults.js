/**
 * Seed content for the admin-editable FAQ and support contact details.
 *
 * These are only defaults — once an admin saves from the portal, the AppConfig
 * documents win. Shared by controllers/adminController.js (admin read path) and
 * routes/config.js (public mobile read path) so the two cannot drift apart.
 *
 * NOTE: the placeholder contact details below must be replaced with the real
 * support email and phone number before release.
 */

const DEFAULT_SUPPORT_CONTACT = {
  email: 'support@ecodash.lk',
  phone: '+94 11 234 5678',
  whatsapp: '+94 77 123 4567',
  hours: 'Monday to Friday, 9:00 AM – 5:00 PM',
};

const DEFAULT_FAQ_ITEMS = [
  // ---- Everyone ----
  {
    id: 'gen-what-is',
    role: 'all',
    question: 'What is EcoDash?',
    answer:
      'EcoDash connects households, waste collectors and recycling vendors on one platform. You hand over recyclable waste, collectors pick it up or accept drop-offs, and vendors buy it on for recycling — and you get rewarded for taking part.',
  },
  {
    id: 'gen-points-cash',
    role: 'all',
    question: 'How do points and cash rewards work?',
    answer:
      'Every waste type has a points rate and a cash rate per kilogram. When a collector records your waste, the reward is calculated automatically and added to your account. Rates differ by material — e-waste and metal are worth the most, organic waste the least.',
  },
  {
    id: 'gen-free',
    role: 'all',
    question: 'Does EcoDash cost anything to use?',
    answer:
      'No. Creating an account and using the app is free for households, collectors and vendors.',
  },
  {
    id: 'gen-account-trouble',
    role: 'all',
    question: 'I cannot log in or register. What should I do?',
    answer:
      'First check that you selected the correct role on the login screen — households, collectors and vendors each sign in under their own role. If that does not help, contact us using the details at the bottom of this screen and we will sort it out.',
  },

  // ---- Household users ----
  {
    id: 'user-qr',
    role: 'user',
    question: 'What is my QR code for?',
    answer:
      'Your QR code identifies your account. When you drop waste off with a collector, they scan it and the points or cash go straight to you. You can show it any time from Profile → Show My QR Code.',
  },
  {
    id: 'user-list-waste',
    role: 'user',
    question: 'How do I sell waste from home?',
    answer:
      'Go to My Offers and create a listing with the waste type, quantity and photos. Nearby collectors can see it and send you purchase requests. You choose which request to accept, and the collector comes to you.',
  },
  {
    id: 'user-choose-request',
    role: 'user',
    question: 'How do I decide which collector to accept?',
    answer:
      'Each request shows the price offered and the collector\'s star rating from other users, alongside a performance score based on how active and reliable they have actually been. You are free to reject any request you are not happy with.',
  },
  {
    id: 'user-rewards',
    role: 'user',
    question: 'How do I redeem my rewards?',
    answer:
      'Open the Rewards tab to see what is available from our vendor partners. Pick a reward you have enough points for and confirm — your redemption history is on the same screen.',
  },
  {
    id: 'user-badges',
    role: 'user',
    question: 'What are badges and challenges?',
    answer:
      'Badges recognise milestones as you recycle more, from Bronze up to Diamond. Challenges are time-limited goals you can join for bonus points. Both appear on your profile.',
  },

  // ---- Collectors ----
  {
    id: 'col-record',
    role: 'collector',
    question: 'How do I record a collection?',
    answer:
      'Open Scan, scan the user\'s QR code (or type it in if the camera struggles), then enter the waste type and quantity. The reward is calculated and credited to the user automatically.',
  },
  {
    id: 'col-waste-types',
    role: 'collector',
    question: 'Can I change the waste types I accept?',
    answer:
      'Not from the app. You choose your accepted waste types when you register, and only an administrator can change them afterwards. Contact us with the details below and we will update your account.',
  },
  {
    id: 'col-buy-from-users',
    role: 'collector',
    question: 'How do I buy waste listed by households?',
    answer:
      'Browse User Offers, open a listing and send a purchase request with your price and a proposed pickup time. If the user accepts, collect the waste and mark the pickup complete — the payment and points are then released to them.',
  },
  {
    id: 'col-sell-to-vendors',
    role: 'collector',
    question: 'How do I sell my collected waste to vendors?',
    answer:
      'Once waste is in your inventory, create an offer for vendors with the type, quantity and price. Vendors send purchase requests that you can accept, reject or counter-offer.',
  },
  {
    id: 'col-performance',
    role: 'collector',
    question: 'How is my performance score calculated?',
    answer:
      'It is based on things we can measure: how many collections you complete in a month, how often you follow through on pickups you requested, how quickly you answer vendor requests, and your total waste collected. It is separate from your star rating, which comes from users. Stay active and respond promptly and it will rise.',
  },

  // ---- Vendors ----
  {
    id: 'ven-buy',
    role: 'vendor',
    question: 'How do I buy waste from collectors?',
    answer:
      'Browse Offers shows what collectors currently have available. Send a purchase request on anything you want; the collector can accept, reject or send back a counter-offer.',
  },
  {
    id: 'ven-pricing',
    role: 'vendor',
    question: 'What is the Pricing screen for?',
    answer:
      'It is where you publish the rates you are willing to pay per kilogram for each waste type, so collectors know what you buy and at what price before they approach you.',
  },
  {
    id: 'ven-inventory',
    role: 'vendor',
    question: 'Where do I see what I have bought?',
    answer:
      'Purchases lists every transaction and its status; Inventory shows the total quantity you now hold of each waste type.',
  },
  {
    id: 'ven-rewards',
    role: 'vendor',
    question: 'How do the rewards I offer work?',
    answer:
      'You can publish rewards that households redeem with the points they earn from recycling. Redemptions appear in your dashboard so you can honour them.',
  },
];

module.exports = { DEFAULT_FAQ_ITEMS, DEFAULT_SUPPORT_CONTACT };
