import { getSettings } from "@src/services/SettingsService";
import {uploadYouTubeVideo} from "@src/services/YouTubeService";
import {YouTubeVideoPrivacy} from "@src/models/YouTubeVideoPrivacy";
import {isYouTubeVideoUploadError, isYouTubeVideoUploadSuccess} from "@src/models/YouTubeVideoUploadResult";
import {JobHelpers} from "graphile-worker";

export interface UploadVideoTaskPayload {
    title: string;
    description: string;
    videoPath: string;
    // TODO: unsure if we can/should pass additional info like the match label here.
}

function assertIsUploadVideoTaskPayload(payload: unknown): asserts payload is UploadVideoTaskPayload {
    if (payload === null) {
        throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
    } else if (typeof payload === "undefined") {
        throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
    } else if (!(payload as unknown as UploadVideoTaskPayload).title ||
        !(payload as unknown as UploadVideoTaskPayload).description ||
        !(payload as unknown as UploadVideoTaskPayload).videoPath) {
        throw new Error(`Invalid payload (missing required prop): ${JSON.stringify(payload)}`);
    }
}

export async function uploadVideo(payload: unknown, { logger }: JobHelpers): Promise<void> {
    assertIsUploadVideoTaskPayload(payload);

    const settings = await getSettings();
    const uploadResult = await uploadYouTubeVideo(payload.title,
        payload.description,
        payload.videoPath,
        settings.youTubeVideoPrivacy as YouTubeVideoPrivacy);

    if (isYouTubeVideoUploadSuccess(uploadResult)) {
        logger.info(`Successfully uploaded video ${payload.title} with ID ${uploadResult.videoId}`);
        // TODO
        // const postUploadStepsResult =
        //     await handleMatchVideoPostUploadSteps(uploadResult.videoId, label as string, matchKeyObject);
    } else if (isYouTubeVideoUploadError(uploadResult)) {
        logger.warn(`Failed to upload video ${payload.title}: ${uploadResult.error}`);

    } else {
        logger.warn(`An unknown error occurred while processing the YouTube video upload result`);
    }

    logger.info(`Uploaded video ${payload.title}`);
}
