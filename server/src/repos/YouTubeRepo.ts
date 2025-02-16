import { auth, youtube, type youtube_v3 } from "@googleapis/youtube";
import { getSecrets, getSettings, getYouTubePlaylists, setSecret } from "@src/services/SettingsService";
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
import type MatchKey from "@src/models/MatchKey";
import type { YouTubePostUploadSteps } from "@src/models/YouTubePostUploadSteps";
import { TheBlueAllianceTrustedRepo } from "@src/repos/TheBlueAllianceTrustedRepo";
import { VideoType } from "@src/models/VideoType";

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

    const videoPathForUpload = path.join(videoSearchDirectory, videoPath);

    if (!(await fs.exists(videoPathForUpload))) {
        return {
            error: `File ${videoPathForUpload} does not exist`,
        };
    }

    let uploadBody: fs.ReadStream;
    try {
        uploadBody = fs.createReadStream(videoPathForUpload);
    } catch (e: unknown) {
        return {
            error: `Error reading file ${videoPathForUpload} for upload: ${JSON.stringify(e)}`,
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
            body: uploadBody,
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

/**
 * Adds a video to a YouTube playlist.
 *
 * Be careful: Every call to this YouTube API costs 50 quota units
 *
 * @param videoId The ID of the (must be already uploaded) video to add to the playlist
 * @param playlistId The ID of the playlist (must already exist) to add the video to
 *
 * @returns true if the video was successfully added to the playlist, false otherwise
 */
export async function addVideoToPlaylist(videoId: string, playlistId: string): Promise<boolean> {
    const youtubeClient = await getYouTubeApiClient();

    const { sandboxModeEnabled } = await getSettings();
    if (sandboxModeEnabled) {
        logger.info("Would have added the following video to the following playlist:");
        logger.info(`Video ID: ${videoId}, playlist ID: ${playlistId}`);
        return false;
    }

    const result = await youtubeClient.playlistItems.insert({
        part: ["snippet"],
        requestBody: {
            snippet: {
                playlistId,
                resourceId: {
                    kind: "youtube#video",
                    videoId,
                },
            },
        },
    }, {
        // Don't throw an exception because of the HTTP request's status code
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validateStatus: (status) => true,
    });

    if (result.status >= 400) {
        logger.err(
          `Error adding video ${videoId} to playlist ${playlistId}: ${result.status} ${result.statusText}`,
        );
        return false;
    }

    if (!result.data.id) {
        logger.err(
          `No ID returned from YouTube API while trying to add video ${videoId} to playlist ${playlistId}}`,
        );
        return false;
    }

    return true;
}

/**
 * Given a match video's label, returns the ID of the YouTube playlist that it should be added to.
 *
 * @param label The label (case-sensitive) of the match video
 */
export async function getPlaylistIdForVideoLabel(label: string): Promise<string | undefined> {
    const playlists = await getYouTubePlaylists();

    return playlists[label]?.id;
}

/**
 * Handles post-upload steps for a video, such as adding it to a playlist.
 * @param videoType The type of the video (e.g., match video or event media)
 * @param videoId The ID of the uploaded video on YouTube
 * @param videoLabel The label (NOT case-sensitive) of the match video
 * @param matchKey The match key of the match that the video is for, only required when video type is match video
 * @param eventKey Event key, only required when video type is event media
 */
export async function handleMatchVideoPostUploadSteps(videoType: VideoType,
  videoId: string,
  videoLabel: string,
  matchKey: MatchKey | null,
  eventKey: string | null):
  Promise<YouTubePostUploadSteps> {
    if (videoType === VideoType.EventMedia && !eventKey) {
        throw new Error("Event key is required when video type is event media");
    }

    if (videoType === VideoType.MatchVideo && !matchKey) {
        throw new Error("Match key is required when video type is match video");
    }

    // Make video labels more flexible by not requiring them to match case
    const lowercasedVideoLabel = videoLabel.toLowerCase();
    const playlistId = await getPlaylistIdForVideoLabel(lowercasedVideoLabel);
    let addToPlaylistSuccess = false;

    if (playlistId) {
        addToPlaylistSuccess = await addVideoToPlaylist(videoId, playlistId);

        if (!addToPlaylistSuccess) {
            logger.err(`Failed to add video ${videoId} to playlist ${playlistId}`);
        }
    } else {
        addToPlaylistSuccess = true;
        logger.warn(`No playlist ID found for video label ${lowercasedVideoLabel}`);
    }

    const { linkVideosOnTheBlueAlliance } = await getSettings();
    const {
        theBlueAllianceTrustedApiAuthId: authId,
        theBlueAllianceTrustedApiAuthSecret: authSecret,
    } = await getSecrets();

    let linkOnTbaSuccess = false;
    if (linkVideosOnTheBlueAlliance) {
        if (authId && authSecret) {
            const tbaTrustedRepo = new TheBlueAllianceTrustedRepo(authId, authSecret);
            try {
                if (videoType === VideoType.EventMedia && eventKey) {
                    await tbaTrustedRepo.postEventMedia(eventKey, videoId);
                } else if (videoType === VideoType.MatchVideo && matchKey) {
                    await tbaTrustedRepo.postMatchVideo(matchKey, videoId);
                } else {
                    throw new Error(`Unexpected video type ${videoType} missing event key (${eventKey}) and match key`);
                }
                linkOnTbaSuccess = true;
            } catch (e) {
                logger.err(`Failed to post match video ${videoId} to The Blue Alliance: ${e}`);
            }
        } else {
            logger.err("Failed to post video to The Blue Alliance: missing auth ID or auth secret. If " +
              "you don't want to associate videos on The Blue Alliance. Go to Settings in the client and " +
              "disable the 'Link match videos on TBA' feature.");
        }
    } else {
        linkOnTbaSuccess = true;
        logger.info(`Skipping linking video ${videoId} for ${matchKey?.matchKey ?? eventKey ?? "unknown"}, setting` +
          "is disabled");
    }

    return {
        addToYouTubePlaylist: addToPlaylistSuccess,
        linkOnTheBlueAlliance: linkOnTbaSuccess,
    };
}
