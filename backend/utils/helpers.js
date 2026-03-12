const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate QR Code for user
exports.generateUserQRCode = async (userId) => {
  try {
    const qrData = {
      userId: userId,
      type: 'user',
      timestamp: Date.now()
    };
    
    const qrString = JSON.stringify(qrData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString);
    
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Error generating QR code');
  }
};

// Generate unique redemption code using crypto (built-in Node.js)
exports.generateRedemptionCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Generate QR Code for reward redemption
exports.generateRedemptionQRCode = async (redemptionData) => {
  try {
    const qrString = JSON.stringify(redemptionData);
    const qrCodeDataURL = await QRCode.toDataURL(qrString);
    
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Error generating redemption QR code');
  }
};

// Calculate points based on waste quantity and type
exports.calculatePoints = (wasteType, quantity) => {
  const pointsPerKg = {
    'E-waste': 50,
    'Plastic': 10,
    'Polythene': 10,
    'Glass': 5,
    'Paper': 5,
    'Metal': 20,
    'Organic': 3
  };

  const basePoints = pointsPerKg[wasteType] || 5;
  return Math.floor(basePoints * quantity);
};

// Check if user has earned a badge
exports.checkBadgeEligibility = async (user, badges) => {
  const earnedBadges = [];
  
  for (const badge of badges) {
    if (user.badges.includes(badge._id)) {
      continue; // Already earned
    }

    let eligible = false;

    switch (badge.criteria.type) {
      case 'waste_quantity':
        if (user.totalWasteDisposed >= badge.criteria.threshold) {
          eligible = true;
        }
        break;
      case 'transactions_count':
        // Will need to count transactions separately
        break;
      // Add more criteria checks as needed
    }

    if (eligible) {
      earnedBadges.push(badge._id);
    }
  }

  return earnedBadges;
};
