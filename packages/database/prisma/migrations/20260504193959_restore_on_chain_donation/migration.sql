-- CreateTable
CREATE TABLE "OnChainDonation" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "rawAmount" TEXT NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "amountBrl" DOUBLE PRECISION NOT NULL,
    "coffees" INTEGER NOT NULL,
    "donor" TEXT NOT NULL,
    "name" VARCHAR(100),
    "message" VARCHAR(1400),
    "encryptedMessage" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "blockNumber" TEXT NOT NULL,
    "donatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnChainDonation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnChainDonation_txHash_key" ON "OnChainDonation"("txHash");

-- CreateIndex
CREATE INDEX "OnChainDonation_network_donatedAt_idx" ON "OnChainDonation"("network", "donatedAt");

-- CreateIndex
CREATE INDEX "OnChainDonation_donor_idx" ON "OnChainDonation"("donor");

-- CreateIndex
CREATE INDEX "OnChainDonation_amountBrl_idx" ON "OnChainDonation"("amountBrl");

-- CreateIndex
CREATE INDEX "OnChainDonation_token_idx" ON "OnChainDonation"("token");
