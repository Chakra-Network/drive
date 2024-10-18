-- CreateTable
CREATE TABLE "JwtHash" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JwtHash_pkey" PRIMARY KEY ("id")
);
