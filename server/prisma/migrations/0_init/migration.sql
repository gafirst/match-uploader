-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'STARTED', 'FAILED_RETRYABLE', 'FAILED', 'COMPLETED');

-- CreateTable
CREATE TABLE "WorkerJob" (
    "jobId" TEXT NOT NULL,
    "workerId" TEXT,
    "task" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "queue" TEXT,
    "payload" JSONB,
    "error" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL,
    "youTubeVideoId" TEXT,
    "addedToYouTubePlaylist" BOOLEAN,
    "linkedOnTheBlueAlliance" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerJob_pkey" PRIMARY KEY ("jobId")
);

