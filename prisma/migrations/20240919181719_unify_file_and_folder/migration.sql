/*
  Warnings:

  - You are about to drop the column `fileId` on the `FileShare` table. All the data in the column will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fileEntryId` to the `FileShare` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_folderId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_ownerPK_fkey";

-- DropForeignKey
ALTER TABLE "FileShare" DROP CONSTRAINT "FileShare_fileId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_ownerPK_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parentFolderId_fkey";

-- AlterTable
ALTER TABLE "FileShare" DROP COLUMN "fileId",
ADD COLUMN     "fileEntryId" TEXT NOT NULL;

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "Folder";

-- CreateTable
CREATE TABLE "FileEntry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ownerPK" TEXT NOT NULL,
    "parentId" TEXT,
    "size" INTEGER,
    "mimeType" TEXT,
    "url" TEXT,
    "encryptionKey" TEXT,
    "metadata" JSONB,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileEntry_ownerPK_idx" ON "FileEntry"("ownerPK");

-- CreateIndex
CREATE INDEX "FileEntry_parentId_idx" ON "FileEntry"("parentId");

-- CreateIndex
CREATE INDEX "FileEntry_type_idx" ON "FileEntry"("type");

-- CreateIndex
CREATE INDEX "FileShare_fileEntryId_idx" ON "FileShare"("fileEntryId");

-- CreateIndex
CREATE INDEX "FileShare_ownerPK_idx" ON "FileShare"("ownerPK");

-- CreateIndex
CREATE INDEX "FileShare_sharedWithPK_idx" ON "FileShare"("sharedWithPK");

-- CreateIndex
CREATE INDEX "Purchase_userPK_idx" ON "Purchase"("userPK");

-- AddForeignKey
ALTER TABLE "FileEntry" ADD CONSTRAINT "FileEntry_ownerPK_fkey" FOREIGN KEY ("ownerPK") REFERENCES "User"("publicKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileEntry" ADD CONSTRAINT "FileEntry_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FileEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_fileEntryId_fkey" FOREIGN KEY ("fileEntryId") REFERENCES "FileEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
