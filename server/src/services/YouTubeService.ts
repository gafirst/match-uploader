import { auth } from "@googleapis/youtube";
import { getSecrets, getSettings, getYouTubePlaylists, setYouTubePlaylist } from "@src/services/SettingsService";
import logger from "jet-logger";
import { type Credentials, type OAuth2Client } from "google-auth-library";
import EnvVars from "@src/constants/EnvVars";
import FullPaths from "@src/routes/constants/FullPaths";
import { type YouTubeChannelList } from "@src/models/YouTubeChannel";
import { type YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import { type YouTubePostUploadSteps } from "@src/models/YouTubePostUploadSteps";
import { TheBlueAllianceTrustedRepo } from "@src/repos/TheBlueAllianceTrustedRepo";
import type MatchKey from "@src/models/MatchKey";
import { queueJob } from "@src/services/WorkerService";
import { UPLOAD_VIDEO } from "@src/tasks/types/tasks";
import { type WorkerJob } from "@prisma/client";
import { getYouTubeApiClient } from "@src/repos/YouTubeRepo";

export function getGoogleOAuth2RedirectUri(requestProtocol: string): string {
    const port = EnvVars.port;
    const includePort = port !== 80 && port !== 443;
    const portString = includePort ? `:${port}` : "";
    return `${requestProtocol}://${EnvVars.host}${portString}${FullPaths.YouTube.Auth.Callback}`;
}

export async function getGoogleOAuth2Client(requestProtocol: string): Promise<OAuth2Client> {
    const settings = await getSettings();
    const secrets = await getSecrets();

    return new auth.OAuth2(
        settings.googleClientId,
        secrets.googleClientSecret,
        getGoogleOAuth2RedirectUri(requestProtocol),
    );
}

export async function getOAuth2AuthUrl(requestProtocol: string): Promise<string> {
    const client = await getGoogleOAuth2Client(requestProtocol);

    const scope = [
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.upload",
    ];

    const authUrl = client.generateAuthUrl({
        access_type: "offline",
        include_granted_scopes: true,
        scope,
    });
    logger.info(authUrl);
    return authUrl;
}

export async function oauth2AuthCodeExchange(code: string, requestProtocol: string): Promise<Credentials> {
    const client = await getGoogleOAuth2Client(requestProtocol);

    const { tokens } = await client.getToken(code);

    return tokens;
}

export async function getAuthenticatedYouTubeChannels(): Promise<YouTubeChannelList[] | undefined> {
    const youtubeClient = await getYouTubeApiClient();

    const resp = await youtubeClient.channels.list({
        mine: true,
        part: ["snippet"],
    });

    return resp.data.items?.map((item) => {
        return {
            id: item.id,
            title: item.snippet?.title,
            thumbnailUrl: item.snippet?.thumbnails?.default?.url,
        };
    });
}

/**
 * Adds a video to a YouTube playlist.
 *
 * Be careful: Every call to this YouTube API costs 50 quota units
 *
 * @param videoId The ID of the (must be already uploaded) video to add to the playlist
 * @param playlistId The ID of the playlist (must already exist) to add the video to
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
    });

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
 * Handles post-upload steps for a match video, such as adding it to a playlist.
 * @param videoId The ID of the uploaded video on YouTube
 * @param videoLabel The label (NOT case-sensitive) of the match video
 * @param matchKey The match key of the match that the video is for
 */
export async function handleMatchVideoPostUploadSteps(videoId: string, videoLabel: string, matchKey: MatchKey):
    Promise<YouTubePostUploadSteps> {
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
                await tbaTrustedRepo.postMatchVideo(matchKey, videoId);
                linkOnTbaSuccess = true;
            } catch (e) {
                logger.err(`Failed to post match video ${videoId} to The Blue Alliance: ${e}`);
            }
        } else {
            logger.err("Failed to post match video to The Blue Alliance: missing auth ID or auth secret. If " +
                "you don't want to associate match videos on The Blue Alliance. Go to Settings in the client and " +
                "disable the 'Link match videos on TBA' feature.");
        }
    } else {
        linkOnTbaSuccess = true;
        logger.info(`Skipping linking video ${videoId} for match ${matchKey.matchKey}, setting is disabled`);
    }

    return {
        addToYouTubePlaylist: addToPlaylistSuccess,
        linkOnTheBlueAlliance: linkOnTbaSuccess,
    };
}

/**
 * Queues a job to upload a video to YouTube.
 *
 * @param title
 * @param description
 * @param videoPath
 * @param privacy
 * @param matchKey
 * @param label
 */
export async function queueYouTubeVideoUpload(title: string,
                                              description: string,
                                              videoPath: string,
                                              privacy: YouTubeVideoPrivacy,
                                              matchKey: MatchKey,
                                              label: string,
): Promise<WorkerJob> {
    return await queueJob(title, UPLOAD_VIDEO, {
        title,
        description,
        videoPath,
        privacy,
        label,
        matchKey: matchKey.matchKey,
        playoffsType: matchKey.playoffsType,
    }, {
        queueName: UPLOAD_VIDEO,
        maxAttempts: 2,
    });
}

export async function cachePlaylistNames(forceUpdate = false): Promise<boolean> {
    const playlists = await getYouTubePlaylists();

    if (!playlists) {
        return false;
    }

    // map playlist IDs to labels
    const playlistIdsToLabels: Record<string, string> = {};
    Object.keys(playlists).forEach((label) => {
        playlistIdsToLabels[playlists[label].id] = label;
    });

    const playlistsWithoutNames = Object.values(playlists).filter((playlist) => !playlist.name);

    if (!forceUpdate && playlistsWithoutNames.length === 0) {
        return true;
    }

    const youtubeClient = await getYouTubeApiClient();

    const playlistIds = playlistsWithoutNames.map((playlist) => playlist.id);

    const result = await youtubeClient.playlists.list({
        part: ["snippet"],
        id: playlistIds,
    });

    if (result.data.items && result.data.items.length !== playlistIds.length) {
        logger.warn(`Expecting data for playlist IDs ${playlistIds.join(", ")}, but did not receive data ` +
            `back for all of them (see below). This might mean that some of the playlist IDs are invalid or not ` +
            `accessible by this channel.`);
        logger.info(`YouTube API response for playlist IDs: ${JSON.stringify(result.data.items)}`);
    }

    if (!result.data.items) {
        return false;
    }

    for (const playlist of result.data.items) {
        if (playlist.id && playlist.snippet?.title && playlistIdsToLabels[playlist.id]) {
            await setYouTubePlaylist(playlistIdsToLabels[playlist.id], playlist.id, playlist.snippet?.title);
        }
    }

    return true;
}
