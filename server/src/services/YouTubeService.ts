import { auth, youtube, type youtube_v3 } from "@googleapis/youtube";
import { getSecrets, getSettings, getYouTubePlaylists, setYouTubePlaylist } from "@src/services/SettingsService";
import logger from "jet-logger";
import { type Credentials, type OAuth2Client } from "google-auth-library";
import EnvVars from "@src/constants/EnvVars";
import FullPaths from "@src/routes/constants/FullPaths";
import { type YouTubeChannelList } from "@src/models/YouTubeChannel";
import fs from "fs-extra";
import { type YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import path from "path";
import sanitizeFilename from "sanitize-filename";
import { type YouTubeVideoUploadError, type YouTubeVideoUploadSuccess } from "@src/models/YouTubeVideoUploadResult";
import { type YouTubePostUploadSteps } from "@src/models/YouTubePostUploadSteps";

export function getGoogleOAuth2RedirectUri(requestProtocol: string): string {
  const port = EnvVars.Port;
  const includePort = port !== "80" && port !== "443";
  const portString = includePort ? `:${port}` : "";
  return `${requestProtocol}://${EnvVars.Host}${portString}${FullPaths.YouTube.Auth.Callback}`;
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
export async function getYouTubeApiClient(): Promise<youtube_v3.Youtube> {
  const { googleClientId } = await getSettings();
  const { googleClientSecret, googleAccessToken, googleRefreshToken } = await getSecrets();

  // Note we use auth from the @googleapis/youtube package, while google-auth-library is around mostly for its
  // TypeScript types
  const oauth2Client = new auth.OAuth2(
      googleClientId,
      googleClientSecret,
  );

  oauth2Client.setCredentials({
    access_token: googleAccessToken,
    refresh_token: googleRefreshToken,
  });

  return youtube({
    version: "v3",
    auth: oauth2Client,
  });
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
 * @param label
 */
export async function getPlaylistIdForVideoLabel(label: string): Promise<string | undefined> {
    const playlists = await getYouTubePlaylists();

    return playlists[label]?.id;
}

export async function handleMatchVideoPostUploadSteps(videoId: string, videoLabel: string):
    Promise<YouTubePostUploadSteps> {
    const playlistId = await getPlaylistIdForVideoLabel(videoLabel);
    let addToPlaylistSuccess = false;

    if (playlistId) {
        addToPlaylistSuccess = await addVideoToPlaylist(videoId, playlistId);

        if (!addToPlaylistSuccess) {
            logger.err(`Failed to add video ${videoId} to playlist ${playlistId}`);
        }
    } else {
        logger.err(`No playlist ID found for video label ${videoLabel}`);
    }

    return {
        addToYouTubePlaylist: addToPlaylistSuccess,
    };
}

/**
 * Uploads a video to YouTube.
 * @param title
 * @param description
 * @param videoPath
 * @param privacy
 */
export async function uploadYouTubeVideo(title: string,
                                         description: string,
                                         videoPath: string,
                                         privacy: YouTubeVideoPrivacy,
): Promise<YouTubeVideoUploadSuccess | YouTubeVideoUploadError> {
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
            body: fs.createReadStream(path.join(videoSearchDirectory, videoPath)),
        },
    };

    if (sandboxModeEnabled) {
        logger.info("Would have uploaded the following YouTube video:");
        logger.info(JSON.stringify(uploadParams, null, 2));
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return {
            error: "Sandbox mode enabled. Check the logs to review upload metadata.",
        };
    }

    const result = await youtubeClient.videos.insert(uploadParams);

    logger.info(result.data);

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
