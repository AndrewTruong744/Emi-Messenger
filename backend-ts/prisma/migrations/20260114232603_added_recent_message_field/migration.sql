/*
  Warnings:

  - Added the required column `recentMessage` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "recentMessage" TEXT NOT NULL;
