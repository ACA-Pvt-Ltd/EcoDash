const WasteTransaction = require('../models/WasteTransaction');
const CollectorPurchaseRequest = require('../models/CollectorPurchaseRequest');
const WastePurchase = require('../models/WastePurchase');
const RewardRedemption = require('../models/RewardRedemption');
// Registered so the populates below can resolve their refs
require('../models/UserWasteOffer');
require('../models/Reward');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const who = (doc) => (doc ? { _id: doc._id, name: doc.name, email: doc.email } : null);

/**
 * Every kind of transaction the admin Transactions page can list. Each entry
 * knows its collection, its statuses, how to shape a row, and how to summarise
 * ALL matching records (not just the loaded page).
 */
const TYPES = {
  // Users ↔ Collectors: user drops waste off, collector scans their QR and awards points or cash
  dropoff: {
    Model: WasteTransaction,
    statuses: ['pending', 'verified', 'rejected'],
    populate: [['user', 'name email'], ['collector', 'name email']],
    row: (t) => ({
      _id: t._id,
      from: who(t.user),
      to: who(t.collector),
      wasteType: t.wasteType,
      quantity: t.quantity,
      reward: t.rewardType === 'cash'
        ? { type: 'cash', amount: t.cashAmount || 0 }
        : { type: 'points', amount: t.pointsEarned || 0 },
      status: t.status,
      date: t.createdAt,
    }),
    totals: async (match) => {
      const [r] = await WasteTransaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            verifiedKg: {
              $sum: {
                $cond: [{ $and: [{ $eq: ['$status', 'verified'] }, { $eq: ['$quantity.unit', 'kg'] }] }, '$quantity.value', 0],
              },
            },
            pointsAwarded: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, { $ifNull: ['$pointsEarned', 0] }, 0] } },
            cashAwarded: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, { $ifNull: ['$cashAmount', 0] }, 0] } },
          },
        },
      ]);
      return { verifiedKg: r?.verifiedKg || 0, pointsAwarded: r?.pointsAwarded || 0, cashAwarded: r?.cashAwarded || 0 };
    },
  },

  // Users ↔ Collectors: collector buys from a user's listed offer
  'user-sale': {
    Model: CollectorPurchaseRequest,
    statuses: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    populate: [['user', 'name email'], ['collector', 'name email'], ['userOffer', 'wasteType quantity']],
    row: (r) => ({
      _id: r._id,
      from: who(r.user),
      to: who(r.collector),
      wasteType: r.userOffer?.wasteType || null,
      quantity: r.userOffer?.quantity || null,
      amount: r.finalPayment ?? r.proposedPrice ?? null,
      status: r.status,
      date: r.completedAt || r.createdAt,
    }),
    totals: async (match) => {
      const [r] = await CollectorPurchaseRequest.aggregate([
        { $match: { ...match, status: 'completed' } },
        { $group: { _id: null, completedValue: { $sum: { $ifNull: ['$finalPayment', { $ifNull: ['$proposedPrice', 0] }] } } } },
      ]);
      return { completedValue: r?.completedValue || 0 };
    },
  },

  // Collectors ↔ Vendors: vendor buys from a collector's offer
  'vendor-sale': {
    Model: WastePurchase,
    statuses: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    populate: [['collector', 'name email'], ['vendor', 'name email']],
    row: (p) => ({
      _id: p._id,
      from: who(p.collector),
      to: who(p.vendor),
      wasteType: p.wasteType,
      quantity: p.quantity,
      amount: p.totalAmount ?? null,
      status: p.status,
      date: p.createdAt,
    }),
    totals: async (match) => {
      const [r] = await WastePurchase.aggregate([
        { $match: { ...match, status: 'completed' } },
        { $group: { _id: null, completedValue: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
      ]);
      return { completedValue: r?.completedValue || 0 };
    },
  },

  // Users ↔ Vendors: user spends points on a vendor reward
  redemption: {
    Model: RewardRedemption,
    statuses: null, // taken from the schema
    populate: [['user', 'name email'], ['vendor', 'name email'], ['reward', 'title']],
    row: (r) => ({
      _id: r._id,
      from: who(r.user),
      to: who(r.vendor),
      reward: r.reward?.title || null,
      points: r.pointsUsed || 0,
      status: r.status,
      date: r.createdAt,
    }),
    totals: async (match) => {
      const [r] = await RewardRedemption.aggregate([
        { $match: match },
        { $group: { _id: null, pointsRedeemed: { $sum: { $ifNull: ['$pointsUsed', 0] } } } },
      ]);
      return { pointsRedeemed: r?.pointsRedeemed || 0 };
    },
  },
};

const TRANSACTION_TYPES = Object.keys(TYPES);

const statusesFor = (type) => TYPES[type].statuses || TYPES[type].Model.schema.path('status')?.enumValues || [];

/** Record count per type, for the section switch and sub-tabs. */
async function countsByType() {
  const entries = await Promise.all(TRANSACTION_TYPES.map(async (t) => [t, await TYPES[t].Model.countDocuments()]));
  return Object.fromEntries(entries);
}

/**
 * One page of transactions of a type, plus a summary over ALL records of that
 * type (so stat cards stay right however many there are).
 */
async function listTransactions({ type = 'dropoff', status, page = 1, limit = DEFAULT_LIMIT }) {
  const def = TYPES[type];
  if (!def) {
    const error = new Error(`Unknown transaction type "${type}". Use one of: ${TRANSACTION_TYPES.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const statuses = statusesFor(type);
  const match = status && statuses.includes(status) ? { status } : {};
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);

  let query = def.Model.find(match).sort({ createdAt: -1, _id: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean();
  for (const [path, select] of def.populate) query = query.populate(path, select);

  const [docs, total, statusCounts, extra, byType] = await Promise.all([
    query,
    def.Model.countDocuments(match),
    def.Model.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    def.totals({}), // stat cards describe the whole type; only the rows follow the status filter
    countsByType(),
  ]);

  const byStatus = Object.fromEntries(statuses.map((s) => [s, 0]));
  for (const { _id, count } of statusCounts) if (_id) byStatus[_id] = count;

  return {
    type,
    data: docs.map(def.row),
    total,
    page: pageNumber,
    limit: pageSize,
    pages: Math.max(Math.ceil(total / pageSize), 1),
    statuses,
    summary: { total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus, ...extra },
    countsByType: byType,
  };
}

module.exports = { listTransactions, TRANSACTION_TYPES, MAX_LIMIT };
