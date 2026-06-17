-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cin" TEXT,
ADD COLUMN     "cinVerified" BOOLEAN NOT NULL DEFAULT false;
