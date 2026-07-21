-- CreateTable
CREATE TABLE "RecordRevision" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecordRevision_recordId_createdAt_idx" ON "RecordRevision"("recordId", "createdAt");

-- AddForeignKey
ALTER TABLE "RecordRevision" ADD CONSTRAINT "RecordRevision_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
