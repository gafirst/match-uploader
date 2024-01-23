import { auth, youtube, type youtube_v3 } from "@googleapis/youtube";
import { getSecrets, getSettings, setSecret } from "@src/services/SettingsService";
import logger from "jet-logger";
import type { YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import type {
    YouTubeVideoUploadError,
    YouTubeVideoUploadInSandboxMode,
    YouTubeVideoUploadSuccess,
} from "@src/models/YouTubeVideoUploadResult";
import sanitizeFilename from "sanitize-filename";
import fs from "fs-extra";
import path from "path";

// Functions in this file should not depend on anything in YouTubeService.ts or
// directly or indirectly depend on anything in server/src/index.ts (e.g., WorkerService.ts), as this
// causes the Express server to run on the worker
// TODO: Refactor file to use repo class pattern
export async function getYouTubeApiClient(): Promise<youtube_v3.Youtube> {
    const { googleClientId } = await getSettings();
    const { googleClientSecret, googleAccessToken, googleRefreshToken, googleTokenExpiry } = await getSecrets();

    // Note we use auth from the @googleapis/youtube package, while google-auth-library is around mostly for its
    // TypeScript types
    const oauth2Client = new auth.OAuth2({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        // forceRefreshOnFailure helps makes sure expired access tokens actually get refreshed,
        // see https://github.com/googleapis/google-api-nodejs-client/issues/2350
        forceRefreshOnFailure: true,
    });

    oauth2Client.setCredentials({
        access_token: googleAccessToken,
        refresh_token: googleRefreshToken,
        // If the expiry date has passed, the client library will refresh the access token automatically
        expiry_date: googleTokenExpiry ? Number.parseInt(googleTokenExpiry, 10) : undefined,
    });

    // If we get back updated tokens from the YouTube API, store the updated tokens and expiry date
    // TODO: This should probably be `once` instead of `on`
    oauth2Client.on("tokens", async (tokens) => {
        logger.info("Received new tokens from YouTube API");
        if (tokens.access_token) {
            logger.info("Storing updated access token");
            await setSecret("googleAccessToken", tokens.access_token);
        }

        if (tokens.refresh_token) {
            logger.info("Storing updated refresh token");
            logger.info(tokens.refresh_token.substring(0, 10));
            await setSecret("googleRefreshToken", tokens.refresh_token);
        }

        if (tokens.expiry_date) {
            logger.info(`Storing new expiry date ${new Date(tokens.expiry_date)}`);
            await setSecret("googleTokenExpiry", tokens.expiry_date.toString());
        }
    });

    return youtube({
        version: "v3",
        auth: oauth2Client,
    });
}

/**
 * Uploads a video to YouTube.
 *
 * Be careful: Every call to this function (and by extension, YouTube API) costs 1600 quota units
 *
 * This function is synchronous. Calls from clients should queue uploads using the queueYouTubeVideoUpload method.
 *
 * @param title
 * @param description
 * @param videoPath
 * @param privacy
 */
export async function uploadYouTubeVideo(title: string,
                                         description: string,
                                         videoPath: string,
                                         privacy: YouTubeVideoPrivacy,
): Promise<YouTubeVideoUploadSuccess | YouTubeVideoUploadInSandboxMode | YouTubeVideoUploadError> {
    const youtubeClient = await getYouTubeApiClient();

    // The parameter is called path but in practice, we can expect it to be a file name
    const sanitizedFileName = sanitizeFilename(videoPath);

    const { videoSearchDirectory, sandboxModeEnabled } = await getSettings();

    if (!sanitizedFileName) {
        return {
            error: "Invalid file name",
        };
    }

    const uploadParams = {
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title,
                description,
                categoryId: "28", // Science & Technology
            },
            status: {
                privacyStatus: privacy,
            },
        },
        media: {
            // TODO(#78): Confirm that the file actually exists first to avoid crashing the Node process otherwise
            body: fs.createReadStream(path.join(videoSearchDirectory, videoPath)),
        },
    };

    if (sandboxModeEnabled) {
        logger.info("Would have uploaded the following YouTube video:");
        logger.info(JSON.stringify(uploadParams, null, 2));
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return {
            sandboxMode: true,
        };
    }

    const result = await youtubeClient.videos.insert(uploadParams);

    const videoId = result.data.id;

    if (!videoId) {
        return {
            error: "No video ID returned",
        };
    }

    return {
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
}
