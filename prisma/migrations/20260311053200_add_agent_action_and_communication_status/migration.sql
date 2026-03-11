-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('DRAFT', 'SENT', 'FAILED');

-- AlterTable: add status column to Communication with default DRAFT
ALTER TABLE "Communication" ADD COLUMN "status" "CommunicationStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill: existing records predate this field — they represent completed communications
UPDATE "Communication" SET "status" = 'SENT';

-- CreateEnum
CREATE TYPE "AgentActionStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'EDITED');

-- CreateTable
CREATE TABLE "AgentAction" (
    "id" TEXT NOT NULL,
    "fundId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "status" "AgentActionStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedPayload" JSONB NOT NULL,
    "finalPayload" JSONB,
    "resultEntityId" TEXT,
    "costUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentAction_fundId_idx" ON "AgentAction"("fundId");

-- CreateIndex
CREATE INDEX "AgentAction_conversationId_idx" ON "AgentAction"("conversationId");

-- CreateIndex
CREATE INDEX "AgentAction_userId_idx" ON "AgentAction"("userId");

-- CreateIndex
CREATE INDEX "AgentAction_status_idx" ON "AgentAction"("status");

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
