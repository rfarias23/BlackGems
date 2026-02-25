-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('SEARCH', 'OPERATE', 'SCALE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "subscriptionTier" "SubscriptionTier",
ADD COLUMN "subscriptionStatus" "SubscriptionStatus",
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT,
ADD COLUMN "trialEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeSubscriptionId_key" ON "Organization"("stripeSubscriptionId");
