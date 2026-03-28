-- CreateEnum
CREATE TYPE "DonationProvider" AS ENUM ('STRIPE', 'PIX', 'ETH');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100),
    "message" VARCHAR(500),
    "coffees" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "provider" "DonationProvider" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isMonthly" BOOLEAN NOT NULL DEFAULT false,
    "stripePaymentIntentId" TEXT,
    "abacatePayChargeId" TEXT,
    "txHash" TEXT,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_stripePaymentIntentId_key" ON "Donation"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_abacatePayChargeId_key" ON "Donation"("abacatePayChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_txHash_key" ON "Donation"("txHash");

-- CreateIndex
CREATE INDEX "Donation_status_createdAt_idx" ON "Donation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Donation_amount_idx" ON "Donation"("amount");

-- CreateIndex
CREATE INDEX "Donation_provider_idx" ON "Donation"("provider");
