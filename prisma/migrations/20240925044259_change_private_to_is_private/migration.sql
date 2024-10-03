/*
  Warnings:

  - You are about to drop the column `private` on the `FileEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FileEntry" DROP COLUMN "private",
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;
