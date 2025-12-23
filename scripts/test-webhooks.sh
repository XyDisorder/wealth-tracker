#!/bin/bash

# Script to test webhook ingestion
# Usage: ./scripts/test-webhooks.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
USER_ID="${USER_ID:-user-001}"

echo "🧪 Testing Wealth Tracker Webhooks"
echo "=================================="
echo "Base URL: $BASE_URL"
echo "User ID: $USER_ID"
echo ""

# Test 1: Bank webhook
echo "📤 Test 1: Sending Bank webhook..."
BANK_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"bankId\": \"BNP\",
    \"txnId\": \"txn-test-001\",
    \"date\": \"2025-12-08T12:00:00Z\",
    \"type\": \"credit\",
    \"amount\": 2000,
    \"currency\": \"EUR\",
    \"account\": \"acc-01\",
    \"description\": \"Test salary payment\"
  }")

echo "Response: $BANK_RESPONSE"
echo ""

# Wait a bit for processing
sleep 2

# Test 2: Crypto webhook with fiat value
echo "📤 Test 2: Sending Crypto webhook (with fiat value)..."
CRYPTO_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"platform\": \"Coinbase\",
    \"id\": \"tx-crypto-001\",
    \"time\": 1710001000000,
    \"type\": \"crypto_deposit\",
    \"asset\": \"BTC\",
    \"amount\": 0.05,
    \"fiatValue\": 1500,
    \"currency\": \"EUR\",
    \"walletId\": \"acc-03\"
  }")

echo "Response: $CRYPTO_RESPONSE"
echo ""

sleep 2

# Test 3: Crypto webhook without fiat value (triggers enrichment)
echo "📤 Test 3: Sending Crypto webhook (without fiat value - triggers enrichment)..."
CRYPTO_NO_FIAT_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"platform\": \"Coinbase\",
    \"id\": \"tx-crypto-002\",
    \"time\": 1710001100000,
    \"type\": \"crypto_deposit\",
    \"asset\": \"ETH\",
    \"amount\": 2.5,
    \"walletId\": \"acc-03\"
  }")

echo "Response: $CRYPTO_NO_FIAT_RESPONSE"
echo ""

sleep 2

# Test 4: Insurer webhook
echo "📤 Test 4: Sending Insurer webhook..."
INSURER_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"insurer\": \"AXA\",
    \"transactionId\": \"av-test-001\",
    \"timestamp\": 1710002000000,
    \"movementType\": \"premium\",
    \"amount\": 500,
    \"currency\": \"EUR\",
    \"policyNumber\": \"acc-04\"
  }")

echo "Response: $INSURER_RESPONSE"
echo ""

# Wait for worker to process
echo "⏳ Waiting 5 seconds for worker to process events..."
sleep 5

# Check wealth summary
echo ""
echo "📊 Checking wealth summary..."
SUMMARY=$(curl -s "$BASE_URL/users/$USER_ID/wealth/summary")
echo "$SUMMARY" | jq '.' 2>/dev/null || echo "$SUMMARY"
echo ""

# Check accounts
echo "📊 Checking accounts..."
ACCOUNTS=$(curl -s "$BASE_URL/users/$USER_ID/wealth/accounts")
echo "$ACCOUNTS" | jq '.' 2>/dev/null || echo "$ACCOUNTS"
echo ""

# Check timeline
echo "📊 Checking timeline..."
TIMELINE=$(curl -s "$BASE_URL/users/$USER_ID/wealth/timeline?limit=10")
echo "$TIMELINE" | jq '.' 2>/dev/null || echo "$TIMELINE"
echo ""

echo "✅ Tests completed!"

