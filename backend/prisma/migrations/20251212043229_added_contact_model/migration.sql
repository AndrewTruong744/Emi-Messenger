/*
  Warnings:

  - You are about to drop the column `contacts` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "contacts";

-- CreateTable
CREATE TABLE "Contact" (
    "userAId" INTEGER NOT NULL,
    "userBId" INTEGER NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("userAId","userBId")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
