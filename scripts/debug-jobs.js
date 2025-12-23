#!/usr/bin/env node

/**
 * Debug script to check job status and events
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging Jobs and Events\n');

  // Check jobs
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`📋 Jobs (${jobs.length}):`);
  jobs.forEach((job) => {
    console.log(
      `  - ${job.id.substring(0, 8)}... | ${job.type} | ${job.status} | attempts: ${job.attempts} | error: ${job.lastError || 'none'}`,
    );
  });
  console.log('');

  // Check raw events
  const rawEvents = await prisma.rawEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log(`📥 Raw Events (${rawEvents.length}):`);
  rawEvents.forEach((event) => {
    console.log(
      `  - ${event.id.substring(0, 8)}... | ${event.provider} | user: ${event.userId}`,
    );
  });
  console.log('');

  // Check normalized events
  const normalizedEvents = await prisma.normalizedEvent.findMany({
    orderBy: { ingestedAt: 'desc' },
    take: 10,
  });

  console.log(`✨ Normalized Events (${normalizedEvents.length}):`);
  normalizedEvents.forEach((event) => {
    console.log(
      `  - ${event.id.substring(0, 8)}... | ${event.provider} | ${event.status} | user: ${event.userId}`,
    );
  });
  console.log('');

  // Check event heads
  const eventHeads = await prisma.eventHead.findMany({
    take: 10,
  });

  console.log(`📌 Event Heads (${eventHeads.length}):`);
  eventHeads.forEach((head) => {
    console.log(
      `  - key: ${head.canonicalKey.substring(0, 40)}... | user: ${head.userId} | version: ${head.latestVersion}`,
    );
  });
  console.log('');

  // Check projections
  const summaries = await prisma.userSummaryView.findMany({
    take: 10,
  });

  console.log(`📊 User Summaries (${summaries.length}):`);
  summaries.forEach((summary) => {
    console.log(`  - user: ${summary.userId} | status: ${summary.valuationStatus}`);
  });
  console.log('');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

