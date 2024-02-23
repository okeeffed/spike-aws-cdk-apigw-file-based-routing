/*
  Warnings:

  - The primary key for the `StripeInvoice` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "StripeInvoice" DROP CONSTRAINT "StripeInvoice_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "StripeInvoice_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "StripeInvoice_id_seq";
