-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Add accountId columns (nullable for backfill)
ALTER TABLE "Record" ADD COLUMN "accountId" TEXT;
ALTER TABLE "Tag" ADD COLUMN "accountId" TEXT;

-- Backfill: cuenta legacy para datos existentes
INSERT INTO "Account" ("id", "name", "createdAt")
VALUES ('legacy-account', 'Legacy', CURRENT_TIMESTAMP);

UPDATE "Record" SET "accountId" = 'legacy-account' WHERE "accountId" IS NULL;
UPDATE "Tag" SET "accountId" = 'legacy-account' WHERE "accountId" IS NULL;

-- Make accountId required
ALTER TABLE "Record" ALTER COLUMN "accountId" SET NOT NULL;
ALTER TABLE "Tag" ALTER COLUMN "accountId" SET NOT NULL;

-- Drop old Tag.name unique, add composite unique
DROP INDEX IF EXISTS "Tag_name_key";
CREATE UNIQUE INDEX "Tag_accountId_name_key" ON "Tag"("accountId", "name");

-- Foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Record" ADD CONSTRAINT "Record_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- User indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_accountId_key" ON "User"("accountId");
