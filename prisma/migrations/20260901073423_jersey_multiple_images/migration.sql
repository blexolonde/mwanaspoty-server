/*
  Warnings:

  - You are about to drop the column `image` on the `Jersey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Jersey" DROP COLUMN "image",
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
