-- CreateTable
CREATE TABLE "RawEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "NormalizedEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "ingestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "description" TEXT,
    "fiatCurrency" TEXT,
    "fiatAmountMinor" TEXT,
    "assetSymbol" TEXT,
    "assetAmount" TEXT,
    "valuationStatus" TEXT,
    "canonicalKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "supersededById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "hashMeaningful" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "EventHead" (
    "canonicalKey" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "latestEventId" TEXT NOT NULL,
    "latestVersion" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccountView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "balancesByCurrency" TEXT NOT NULL,
    "cryptoPositions" TEXT NOT NULL,
    "lastUpdatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSummaryView" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "balancesByCurrency" TEXT NOT NULL,
    "cryptoPositions" TEXT NOT NULL,
    "valuationStatus" TEXT NOT NULL,
    "missingCryptoValuations" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TimelineView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "provider" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT,
    "fiatCurrency" TEXT,
    "fiatAmountMinor" TEXT,
    "assetSymbol" TEXT,
    "assetAmount" TEXT,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AssetPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetSymbol" TEXT NOT NULL,
    "fiatCurrency" TEXT NOT NULL,
    "priceMinor" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL,
    "rateDecimalString" TEXT NOT NULL,
    "asOf" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "RawEvent_provider_userId_idx" ON "RawEvent"("provider", "userId");

-- CreateIndex
CREATE INDEX "RawEvent_createdAt_idx" ON "RawEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Job_status_lockedAt_idx" ON "Job"("status", "lockedAt");

-- CreateIndex
CREATE INDEX "Job_type_status_idx" ON "Job"("type", "status");

-- CreateIndex
CREATE INDEX "NormalizedEvent_userId_occurredAt_idx" ON "NormalizedEvent"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "NormalizedEvent_canonicalKey_idx" ON "NormalizedEvent"("canonicalKey");

-- CreateIndex
CREATE INDEX "NormalizedEvent_status_idx" ON "NormalizedEvent"("status");

-- CreateIndex
CREATE INDEX "NormalizedEvent_userId_status_idx" ON "NormalizedEvent"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NormalizedEvent_canonicalKey_version_key" ON "NormalizedEvent"("canonicalKey", "version");

-- CreateIndex
CREATE INDEX "EventHead_userId_idx" ON "EventHead"("userId");

-- CreateIndex
CREATE INDEX "AccountView_userId_idx" ON "AccountView"("userId");

-- CreateIndex
CREATE INDEX "AccountView_provider_idx" ON "AccountView"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "AccountView_userId_accountId_key" ON "AccountView"("userId", "accountId");

-- CreateIndex
CREATE INDEX "TimelineView_userId_occurredAt_idx" ON "TimelineView"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "TimelineView_userId_occurredAt_id_idx" ON "TimelineView"("userId", "occurredAt", "id");

-- CreateIndex
CREATE INDEX "AssetPrice_assetSymbol_fiatCurrency_asOf_idx" ON "AssetPrice"("assetSymbol", "fiatCurrency", "asOf");

-- CreateIndex
CREATE INDEX "AssetPrice_asOf_idx" ON "AssetPrice"("asOf");

-- CreateIndex
CREATE UNIQUE INDEX "AssetPrice_assetSymbol_fiatCurrency_asOf_key" ON "AssetPrice"("assetSymbol", "fiatCurrency", "asOf");

-- CreateIndex
CREATE INDEX "FxRate_baseCurrency_quoteCurrency_asOf_idx" ON "FxRate"("baseCurrency", "quoteCurrency", "asOf");

-- CreateIndex
CREATE INDEX "FxRate_asOf_idx" ON "FxRate"("asOf");

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_baseCurrency_quoteCurrency_asOf_key" ON "FxRate"("baseCurrency", "quoteCurrency", "asOf");
