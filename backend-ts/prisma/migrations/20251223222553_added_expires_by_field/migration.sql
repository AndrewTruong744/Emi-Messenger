/*
  Warnings:

  - Added the required column `expiresBy` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "expiresBy" TIMESTAMP(3) NOT NULL;
