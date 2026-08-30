-- AlterTable
ALTER TABLE "Jersey" ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "jerseyId" INTEGER;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_jerseyId_fkey" FOREIGN KEY ("jerseyId") REFERENCES "Jersey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
