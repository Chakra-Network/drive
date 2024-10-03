/*
  Warnings:

  - Changed the type of `type` on the `FileEntry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('file', 'folder');

-- AlterTable
ALTER TABLE "FileEntry" ADD COLUMN     "uploadedSize" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "type",
ADD COLUMN     "type" "FileType" NOT NULL;

-- CreateIndex
CREATE INDEX "FileEntry_type_idx" ON "FileEntry"("type");
