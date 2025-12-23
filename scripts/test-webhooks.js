#!/usr/bin/env node

/**
 * Node.js script to test webhook ingestion
 * Usage: node scripts/test-webhooks.js
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || 'user-001';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🧪 Testing Wealth Tracker Webhooks');
  console.log('==================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${USER_ID}`);
  console.log('');

  // Test 1: Bank webhook
  console.log('📤 Test 1: Sending Bank webhook...');
  try {
    const bankResponse = await makeRequest('POST', '/webhooks', {
      userId: USER_ID,
      bankId: 'BNP',
      txnId: 'txn-test-001',
      date: '2025-12-08T12:00:00Z',
      type: 'credit',
      amount: 2000,
      currency: 'EUR',
      account: 'acc-01',
      description: 'Test salary payment',
    });
    console.log('Response:', JSON.stringify(bankResponse, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  await sleep(2000);

  // Test 2: Crypto webhook with fiat value
  console.log('📤 Test 2: Sending Crypto webhook (with fiat value)...');
  try {
    const cryptoResponse = await makeRequest('POST', '/webhooks', {
      userId: USER_ID,
      platform: 'Coinbase',
      id: 'tx-crypto-001',
      time: 1710001000000,
      type: 'crypto_deposit',
      asset: 'BTC',
      amount: 0.05,
      fiatValue: 1500,
      currency: 'EUR',
      walletId: 'acc-03',
    });
    console.log('Response:', JSON.stringify(cryptoResponse, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  await sleep(2000);

  // Test 3: Crypto webhook without fiat value
  console.log('📤 Test 3: Sending Crypto webhook (without fiat value)...');
  try {
    const cryptoNoFiatResponse = await makeRequest('POST', '/webhooks', {
      userId: USER_ID,
      platform: 'Coinbase',
      id: 'tx-crypto-002',
      time: 1710001100000,
      type: 'crypto_deposit',
      asset: 'ETH',
      amount: 2.5,
      walletId: 'acc-03',
    });
    console.log('Response:', JSON.stringify(cryptoNoFiatResponse, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  await sleep(2000);

  // Test 4: Insurer webhook
  console.log('📤 Test 4: Sending Insurer webhook...');
  try {
    const insurerResponse = await makeRequest('POST', '/webhooks', {
      userId: USER_ID,
      insurer: 'AXA',
      transactionId: 'av-test-001',
      timestamp: 1710002000000,
      movementType: 'premium',
      amount: 500,
      currency: 'EUR',
      policyNumber: 'acc-04',
    });
    console.log('Response:', JSON.stringify(insurerResponse, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  // Wait for worker to process
  console.log('⏳ Waiting 5 seconds for worker to process events...');
  await sleep(5000);

  // Check wealth summary
  console.log('');
  console.log('📊 Checking wealth summary...');
  try {
    const summary = await makeRequest('GET', `/users/${USER_ID}/wealth/summary`);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  // Check accounts
  console.log('📊 Checking accounts...');
  try {
    const accounts = await makeRequest('GET', `/users/${USER_ID}/wealth/accounts`);
    console.log(JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  // Check timeline
  console.log('📊 Checking timeline...');
  try {
    const timeline = await makeRequest('GET', `/users/${USER_ID}/wealth/timeline?limit=10`);
    console.log(JSON.stringify(timeline, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  console.log('');

  console.log('✅ Tests completed!');
}

main().catch(console.error);

