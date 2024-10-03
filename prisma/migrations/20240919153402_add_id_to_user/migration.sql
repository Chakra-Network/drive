/*
  Warnings:

  - You are about to drop the column `ownerId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `FileShare` table. All the data in the column will be lost.
  - You are about to drop the column `sharedWithId` on the `FileShare` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Purchase` table. All the data in the column will be lost.
  - Added the required column `ownerPK` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerPK` to the `FileShare` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sharedWithPK` to the `FileShare` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerPK` to the `Folder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userPK` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "FileShare" DROP CONSTRAINT "FileShare_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "FileShare" DROP CONSTRAINT "FileShare_sharedWithId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_userId_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "ownerId",
ADD COLUMN     "ownerPK" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FileShare" DROP COLUMN "ownerId",
DROP COLUMN "sharedWithId",
ADD COLUMN     "ownerPK" TEXT NOT NULL,
ADD COLUMN     "sharedWithPK" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "ownerId",
ADD COLUMN     "ownerPK" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "userId",
ADD COLUMN     "userPK" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "User_publicKey_idx" ON "User"("publicKey");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerPK_fkey" FOREIGN KEY ("ownerPK") REFERENCES "User"("publicKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_ownerPK_fkey" FOREIGN KEY ("ownerPK") REFERENCES "User"("publicKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_ownerPK_fkey" FOREIGN KEY ("ownerPK") REFERENCES "User"("publicKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_sharedWithPK_fkey" FOREIGN KEY ("sharedWithPK") REFERENCES "User"("publicKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userPK_fkey" FOREIGN KEY ("userPK") REFERENCES "User"("publicKey") ON DELETE RESTRICT ON UPDATE CASCADE;
