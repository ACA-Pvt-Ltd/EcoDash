/**
 * Backfill collector performance scores.
 *
 * Scores are normally recomputed on write (drop-off verified, pickup completed,
 * purchase request answered, dashboard opened). Run this once after deploying
 * the feature so existing collectors get a score without waiting for activity,
 * and any time you change the targets in utils/collectorPerformance.js.
 *
 * Usage:
 *   node recalculate-performance.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Collector = require('./models/Collector');
const { recalculateCollectorPerformance } = require('./utils/collectorPerformance');

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI must be set.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected.');

  const collectors = await Collector.find().select('_id name');
  console.log(`Recalculating performance for ${collectors.length} collector(s)...\n`);

  let scored = 0;
  let insufficient = 0;
  let failed = 0;

  for (const collector of collectors) {
    try {
      const performance = await recalculateCollectorPerformance(collector._id);
      if (performance?.score === null) {
        insufficient += 1;
        console.log(`  · ${collector.name}: not enough activity yet`);
      } else {
        scored += 1;
        console.log(
          `  ✓ ${collector.name}: ${performance.score}/100 ` +
          `(${performance.collectionsLast30Days} collections/30d, ` +
          `${performance.completionRate ?? '—'}% completion)`
        );
      }
    } catch (error) {
      failed += 1;
      console.error(`  ✗ ${collector.name}: ${error.message}`);
    }
  }

  console.log(`\nDone. ${scored} scored, ${insufficient} without enough activity, ${failed} failed.`);
  await mongoose.connection.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (error) => {
  console.error('❌ Backfill failed:', error);
  await mongoose.connection.close();
  process.exit(1);
});
