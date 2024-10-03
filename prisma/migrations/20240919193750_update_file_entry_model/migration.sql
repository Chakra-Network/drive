/*
  Warnings:

  - You are about to drop the column `parentId` on the `FileEntry` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FileEntry" DROP CONSTRAINT "FileEntry_parentId_fkey";

-- DropIndex
DROP INDEX "FileEntry_parentId_idx";

-- AlterTable
ALTER TABLE "FileEntry" DROP COLUMN "parentId",
ADD COLUMN     "folderId" TEXT;

-- CreateIndex
CREATE INDEX "FileEntry_folderId_idx" ON "FileEntry"("folderId");

-- AddForeignKey
ALTER TABLE "FileEntry" ADD CONSTRAINT "FileEntry_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FileEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
