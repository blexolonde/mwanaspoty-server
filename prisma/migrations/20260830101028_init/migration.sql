-- CreateTable
CREATE TABLE "Jersey" (
    "id" SERIAL NOT NULL,
    "team" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "league" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jersey_pkey" PRIMARY KEY ("id")
);
