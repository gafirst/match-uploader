-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'STARTED', 'FAILED_RETRYABLE', 'FAILED', 'COMPLETED');

-- CreateTable
CREATE TABLE "WorkerJob" (
    "id" SERIAL NOT NULL,
    "workerId" TEXT,
    "jobId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "queue" TEXT,
    "payload" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerJob_pkey" PRIMARY KEY ("id")
);

