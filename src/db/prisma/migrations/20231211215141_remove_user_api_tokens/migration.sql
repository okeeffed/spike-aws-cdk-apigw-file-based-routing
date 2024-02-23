/*
  Warnings:

  - You are about to drop the column `userId` on the `ApiToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ApiToken" DROP CONSTRAINT "ApiToken_userId_fkey";

-- AlterTable
ALTER TABLE "ApiToken" DROP COLUMN "userId";
