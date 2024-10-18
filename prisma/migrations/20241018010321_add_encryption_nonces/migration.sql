-- CreateTable
CREATE TABLE "EncryptionNonce" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncryptionNonce_pkey" PRIMARY KEY ("id")
);
