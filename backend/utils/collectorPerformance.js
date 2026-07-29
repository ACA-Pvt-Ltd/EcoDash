const mongoose = require('mongoose');
const Collector = require('../models/Collector');
const WasteTransaction = require('../models/WasteTransaction');
const CollectorPurchaseRequest = require('../models/CollectorPurchaseRequest');
const WastePurchase = require('../models/WastePurchase');

/**
 * Metrics-derived collector score, kept deliberately separate from the
 * user-submitted star rating (Collector.averageRating). Stars say what people
 * felt; this says what the collector actually did.
 *
 * Every metric here must be attributable to the COLLECTOR's own behaviour:
 *  - completion rate excludes requests the *user* rejected (not the collector's
 *    doing) and counts only requests the collector themselves cancelled
 *  - responsiveness reads WastePurchase.collectorResponse.respondedAt, which the
 *    collector sets. CollectorPurchaseRequest.respondedAt is the *user*
 *    answering the collector, so it must not be used here.
 *
 * Tune the platform's expectations here — these are the only magic numbers.
 */
const TARGET_COLLECTIONS_30D = 20;   // collections/month that scores full marks
const TARGET_TOTAL_KG = 1000;        // lifetime kg that scores full marks
const RESPONSE_FAST_HOURS = 2;       // at or under this = full marks
const RESPONSE_SLOW_HOURS = 48;      // at or over this = zero
const MIN_ACTIVITY_FOR_SCORE = 3;    // below this the score stays null, not 0

const WEIGHTS = {
  frequency: 35,
  completion: 35,
  responsiveness: 20,
  volume: 10,
};

const ACTIVITY_WINDOW_DAYS = 30;
const RESPONSE_WINDOW_DAYS = 90;

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const clamp100 = (n) => Math.max(0, Math.min(100, n));

/**
 * Weighted average over the sub-scores that actually have data. A collector
 * with no closed requests yet is not penalised for the completion metric —
 * its weight is redistributed across the metrics we can measure.
 */
function combine(parts) {
  let weighted = 0;
  let totalWeight = 0;

  for (const [key, value] of Object.entries(parts)) {
    if (value === null || value === undefined) continue;
    weighted += value * WEIGHTS[key];
    totalWeight += WEIGHTS[key];
  }

  if (totalWeight === 0) return null;
  return Math.round(weighted / totalWeight);
}

/**
 * Recompute and persist the performance subdocument for one collector.
 * Returns the stored metrics, or null if the collector no longer exists.
 */
async function recalculateCollectorPerformance(collectorId) {
  if (!collectorId) return null;

  const id = new mongoose.Types.ObjectId(String(collectorId));
  const activitySince = daysAgo(ACTIVITY_WINDOW_DAYS);

  const [collector, dropoffs30d, pickups30d, statusCounts, responseAgg] = await Promise.all([
    Collector.findById(id).select('totalWasteCollected'),

    // QR drop-offs recorded in the window (uses the {collector, createdAt} index)
    WasteTransaction.countDocuments({
      collector: id,
      status: { $ne: 'rejected' },
      createdAt: { $gte: activitySince },
    }),

    // Marketplace pickups completed in the window
    CollectorPurchaseRequest.countDocuments({
      collector: id,
      status: 'completed',
      completedAt: { $gte: activitySince },
    }),

    // Lifetime outcome mix (uses the {collector, status} index)
    CollectorPurchaseRequest.aggregate([
      { $match: { collector: id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Mean time for the collector to answer a vendor's purchase request
    WastePurchase.aggregate([
      {
        $match: {
          collector: id,
          'collectorResponse.respondedAt': { $ne: null, $gte: daysAgo(RESPONSE_WINDOW_DAYS) },
        },
      },
      {
        $group: {
          _id: null,
          avgMs: { $avg: { $subtract: ['$collectorResponse.respondedAt', '$createdAt'] } },
          n: { $sum: 1 },
        },
      },
    ]),
  ]);

  if (!collector) return null;

  const byStatus = statusCounts.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});

  const completed = byStatus.completed || 0;
  // Only outcomes the collector controls: they either followed through, or they
  // cancelled their own request. A user rejecting them is not held against them.
  const closed = completed + (byStatus.cancelled || 0);

  const collectionsLast30Days = dropoffs30d + pickups30d;
  const completionRate = closed > 0 ? Math.round((completed / closed) * 100) : null;

  const avgMs = responseAgg[0]?.avgMs ?? null;
  const avgResponseHours =
    avgMs === null ? null : parseFloat((avgMs / (1000 * 60 * 60)).toFixed(1));

  // Sub-scores, each 0-100
  const frequencyScore = clamp100((collectionsLast30Days / TARGET_COLLECTIONS_30D) * 100);
  const volumeScore = clamp100(((collector.totalWasteCollected || 0) / TARGET_TOTAL_KG) * 100);
  const responsivenessScore =
    avgResponseHours === null
      ? null
      : clamp100(
          ((RESPONSE_SLOW_HOURS - avgResponseHours) /
            (RESPONSE_SLOW_HOURS - RESPONSE_FAST_HOURS)) * 100
        );

  // A brand-new collector should read as "no data", never as a bad score
  const totalActivity = closed + dropoffs30d;
  const score =
    totalActivity < MIN_ACTIVITY_FOR_SCORE
      ? null
      : combine({
          frequency: frequencyScore,
          completion: completionRate,
          responsiveness: responsivenessScore,
          volume: volumeScore,
        });

  const performance = {
    score,
    collectionsLast30Days,
    completionRate,
    avgResponseHours,
    computedAt: new Date(),
  };

  await Collector.findByIdAndUpdate(id, { performance });

  return performance;
}

/**
 * Fire-and-forget wrapper for use inside request handlers. Scoring must never
 * fail the collection or pickup that triggered it.
 */
async function refreshPerformanceSafely(collectorId) {
  try {
    await recalculateCollectorPerformance(collectorId);
  } catch (error) {
    console.error(`⚠️ Performance recompute failed for collector ${collectorId}:`, error.message);
  }
}

module.exports = {
  recalculateCollectorPerformance,
  refreshPerformanceSafely,
  TARGET_COLLECTIONS_30D,
  TARGET_TOTAL_KG,
  MIN_ACTIVITY_FOR_SCORE,
};
