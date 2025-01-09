-- CreateTable
CREATE TABLE "UploadedVideo" (
    "youTubeVideoId" TEXT NOT NULL,
    "workerJobId" TEXT,
    "filePath" TEXT NOT NULL,
    "matchKey" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "addToYouTubePlaylistSucceeded" BOOLEAN,
    "linkOnTheBlueAllianceSucceeded" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadedVideo_pkey" PRIMARY KEY ("youTubeVideoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadedVideo_youTubeVideoId_key" ON "UploadedVideo"("youTubeVideoId");

-- AddForeignKey
ALTER TABLE "UploadedVideo" ADD CONSTRAINT "UploadedVideo_workerJobId_fkey" FOREIGN KEY ("workerJobId") REFERENCES "WorkerJob"("jobId") ON DELETE SET NULL ON UPDATE CASCADE;
