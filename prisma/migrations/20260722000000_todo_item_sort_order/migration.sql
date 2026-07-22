-- AlterTable
ALTER TABLE "TodoItem" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TodoItem_sortOrder_idx" ON "TodoItem"("sortOrder");
