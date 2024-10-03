/*
  Warnings:

  - A unique constraint covering the columns `[publicShareId]` on the table `FileEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FileEntry" ADD COLUMN     "isPubliclyShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicShareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FileEntry_publicShareId_key" ON "FileEntry"("publicShareId");

-- CreateIndex
CREATE INDEX "FileEntry_publicShareId_idx" ON "FileEntry"("publicShareId");
