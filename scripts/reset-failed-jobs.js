#!/usr/bin/env node

/**
 * Script to reset failed jobs to PENDING so they can be retried
 * Usage: node scripts/reset-failed-jobs.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetting failed jobs...\n');

  // Reset failed jobs to PENDING
  const result = await prisma.job.updateMany({
    where: {
      status: 'FAILED',
    },
    data: {
      status: 'PENDING',
      lockedAt: null,
      attempts: 0,
      lastError: null,
    },
  });

  console.log(`✅ Reset ${result.count} failed jobs to PENDING`);
  console.log('\n💡 The worker will now retry these jobs with the fixed code.');
  console.log('   Make sure the worker is running: pnpm worker\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

