/*
  Warnings:

  - Added the required column `userId` to the `ApiToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiToken" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ApiToken" ADD CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
