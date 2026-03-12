const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Collector = require('./models/Collector');
const Vendor = require('./models/Vendor');
const Admin = require('./models/Admin');
const Badge = require('./models/Badge');
const Challenge = require('./models/Challenge');
const Reward = require('./models/Reward');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Collector.deleteMany({});
    await Vendor.deleteMany({});
    await Admin.deleteMany({});
    await Badge.deleteMany({});
    await Challenge.deleteMany({});
    await Reward.deleteMany({});

    // Create Admin
    console.log('Creating admin...');
    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@wastemanagement.com',
      password: 'admin123456',
      role: 'superadmin',
      permissions: ['manage_users', 'manage_collectors', 'manage_vendors', 'manage_rewards', 'view_analytics', 'manage_admins']
    });
    console.log('✅ Admin created:', admin.email);

    // Create Sample Collectors
    console.log('Creating collectors...');
    const collectors = await Collector.create([
      {
        name: 'Green Recycling Center',
        email: 'green@recycling.com',
        password: 'collector123',
        phone: '+1-555-0101',
        address: {
          street: '123 Eco Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102'
        },
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // San Francisco
        },
        acceptedWasteTypes: ['E-waste', 'Plastic', 'Glass'],
        operatingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' }
        },
        description: 'Professional e-waste and plastic recycling center',
        isVerified: true,
        verifiedBy: admin._id
      },
      {
        name: 'EcoWaste Solutions',
        email: 'eco@waste.com',
        password: 'collector123',
        phone: '+1-555-0102',
        address: {
          street: '456 Green Avenue',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001'
        },
        location: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522] // Los Angeles
        },
        acceptedWasteTypes: ['Plastic', 'Polythene', 'Paper'],
        operatingHours: {
          monday: { open: '08:00', close: '17:00' },
          tuesday: { open: '08:00', close: '17:00' },
          wednesday: { open: '08:00', close: '17:00' },
          thursday: { open: '08:00', close: '17:00' },
          friday: { open: '08:00', close: '17:00' }
        },
        description: 'Specialized in plastic and paper recycling',
        isVerified: true,
        verifiedBy: admin._id
      },
      {
        name: 'Tech Recyclers Inc',
        email: 'tech@recyclers.com',
        password: 'collector123',
        phone: '+1-555-0103',
        address: {
          street: '789 Tech Boulevard',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128] // New York
        },
        acceptedWasteTypes: ['E-waste', 'Metal'],
        operatingHours: {
          monday: { open: '09:00', close: '19:00' },
          tuesday: { open: '09:00', close: '19:00' },
          wednesday: { open: '09:00', close: '19:00' },
          thursday: { open: '09:00', close: '19:00' },
          friday: { open: '09:00', close: '19:00' },
          saturday: { open: '10:00', close: '18:00' },
          sunday: { open: '12:00', close: '16:00' }
        },
        description: 'E-waste and electronic recycling specialists',
        isVerified: true,
        verifiedBy: admin._id
      }
    ]);
    console.log(`✅ Created ${collectors.length} collectors`);

    // Create Sample Vendors
    console.log('Creating vendors...');
    const vendors = await Vendor.create([
      {
        name: 'EcoStore',
        email: 'contact@ecostore.com',
        password: 'vendor123',
        phone: '+1-555-0201',
        description: 'Your one-stop shop for eco-friendly products',
        businessType: 'Both',
        address: {
          street: '321 Sustainable St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94103'
        },
        website: 'https://ecostore.com',
        location: {
          type: 'Point',
          coordinates: [-122.4120, 37.7849]
        },
        isVerified: true,
        verifiedBy: admin._id
      },
      {
        name: 'Green Coffee House',
        email: 'info@greencoffee.com',
        password: 'vendor123',
        phone: '+1-555-0202',
        description: 'Organic coffee and sustainable living',
        businessType: 'Physical Store',
        address: {
          street: '654 Brew Street',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90002'
        },
        website: 'https://greencoffee.com',
        location: {
          type: 'Point',
          coordinates: [-118.2500, 34.0600]
        },
        isVerified: true,
        verifiedBy: admin._id
      },
      {
        name: 'Nature Foods',
        email: 'hello@naturefoods.com',
        password: 'vendor123',
        phone: '+1-555-0203',
        description: 'Organic and sustainable food products',
        businessType: 'Online',
        website: 'https://naturefoods.com',
        isVerified: true,
        verifiedBy: admin._id
      }
    ]);
    console.log(`✅ Created ${vendors.length} vendors`);

    // Create Sample Rewards
    console.log('Creating rewards...');
    const rewards = await Reward.create([
      {
        vendor: vendors[0]._id,
        title: '10% Off All Eco Products',
        description: 'Get 10% discount on all eco-friendly products in store',
        type: 'Discount',
        pointsRequired: 50,
        discountPercentage: 10,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        category: 'Eco-Products',
        termsAndConditions: 'Valid for one-time use. Cannot be combined with other offers.'
      },
      {
        vendor: vendors[1]._id,
        title: 'Free Coffee',
        description: 'Get a free medium coffee of your choice',
        type: 'Free Item',
        pointsRequired: 100,
        stockAvailable: 50,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        category: 'Food & Beverage',
        termsAndConditions: 'One per customer. Valid at all locations.'
      },
      {
        vendor: vendors[2]._id,
        title: '$5 Discount Voucher',
        description: '$5 off on orders above $30',
        type: 'Voucher',
        pointsRequired: 75,
        discountAmount: 5,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
        category: 'Shopping',
        termsAndConditions: 'Minimum purchase $30 required.'
      },
      {
        vendor: vendors[0]._id,
        title: 'Reusable Water Bottle',
        description: 'Free eco-friendly stainless steel water bottle',
        type: 'Eco-Product',
        pointsRequired: 200,
        stockAvailable: 30,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
        category: 'Eco-Products',
        termsAndConditions: 'While stocks last. Pick up in-store only.'
      }
    ]);
    console.log(`✅ Created ${rewards.length} rewards`);

    // Create Badges
    console.log('Creating badges...');
    const badges = await Badge.create([
      {
        name: 'Eco Beginner',
        description: 'Disposed your first 10kg of waste',
        icon: '🌱',
        level: 'Bronze',
        criteria: {
          type: 'waste_quantity',
          threshold: 10
        },
        rarity: 'Common',
        points: 10
      },
      {
        name: 'Plastic Warrior',
        description: 'Recycled 50kg of plastic waste',
        icon: '♻️',
        level: 'Silver',
        criteria: {
          type: 'waste_quantity',
          threshold: 50,
          wasteType: 'Plastic'
        },
        rarity: 'Uncommon',
        points: 50
      },
      {
        name: 'E-Waste Champion',
        description: 'Disposed 25kg of e-waste',
        icon: '📱',
        level: 'Gold',
        criteria: {
          type: 'waste_quantity',
          threshold: 25,
          wasteType: 'E-waste'
        },
        rarity: 'Rare',
        points: 75
      },
      {
        name: 'Eco Master',
        description: 'Disposed 100kg of total waste',
        icon: '🏆',
        level: 'Platinum',
        criteria: {
          type: 'waste_quantity',
          threshold: 100
        },
        rarity: 'Epic',
        points: 100
      },
      {
        name: 'Sustainability Legend',
        description: 'Disposed 500kg of total waste',
        icon: '👑',
        level: 'Diamond',
        criteria: {
          type: 'waste_quantity',
          threshold: 500
        },
        rarity: 'Legendary',
        points: 250
      }
    ]);
    console.log(`✅ Created ${badges.length} badges`);

    // Create Challenges
    console.log('Creating challenges...');
    const challenges = await Challenge.create([
      {
        title: 'Recycle 10kg This Month',
        description: 'Help save the planet by recycling 10kg of waste this month',
        icon: '🌍',
        type: 'Monthly',
        goal: {
          wasteType: 'Any',
          targetQuantity: 10,
          unit: 'kg'
        },
        reward: {
          points: 100,
          badge: badges[0]._id
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Plastic Free Week',
        description: 'Recycle 5kg of plastic this week',
        icon: '🥤',
        type: 'Weekly',
        goal: {
          wasteType: 'Plastic',
          targetQuantity: 5,
          unit: 'kg'
        },
        reward: {
          points: 50
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'E-Waste Drive',
        description: 'Dispose any amount of e-waste to contribute',
        icon: '💻',
        type: 'Special',
        goal: {
          wasteType: 'E-waste',
          targetQuantity: 1,
          unit: 'kg'
        },
        reward: {
          points: 75
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log(`✅ Created ${challenges.length} challenges`);

    // Create Sample Users
    console.log('Creating sample users...');
    const users = await User.create([
      {
        name: 'Alice Green',
        email: 'alice@example.com',
        password: 'user123',
        phone: '+1-555-1001',
        address: {
          street: '111 Eco Lane',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94104'
        }
      },
      {
        name: 'Bob Eco',
        email: 'bob@example.com',
        password: 'user123',
        phone: '+1-555-1002',
        address: {
          street: '222 Green St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90003'
        }
      }
    ]);
    console.log(`✅ Created ${users.length} sample users`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('=== LOGIN CREDENTIALS ===\n');
    console.log('ADMIN:');
    console.log('  Email: admin@wastemanagement.com');
    console.log('  Password: admin123456\n');
    console.log('COLLECTORS (all use password: collector123):');
    collectors.forEach(c => console.log(`  - ${c.email}`));
    console.log('\nVENDORS (all use password: vendor123):');
    vendors.forEach(v => console.log(`  - ${v.email}`));
    console.log('\nUSERS (all use password: user123):');
    users.forEach(u => console.log(`  - ${u.email}`));
    console.log('\n========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed
seedData();
