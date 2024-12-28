import { auth } from "@googleapis/youtube";
import { getSecrets, getSettings, getYouTubePlaylists, setYouTubePlaylist } from "@src/services/SettingsService";
import logger from "jet-logger";
import { type Credentials, type OAuth2Client } from "google-auth-library";
import EnvVars from "@src/constants/EnvVars";
import FullPaths from "@src/routes/constants/FullPaths";
import { type YouTubeChannelList } from "@src/models/YouTubeChannel";
import { type YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import type MatchKey from "@src/models/MatchKey";
import { UPLOAD_VIDEO } from "@src/tasks/types/tasks";
import { type WorkerJob } from "@prisma/client";
import { getYouTubeApiClient } from "@src/repos/YouTubeRepo";
import { graphileWorkerUtils, prisma } from "@src/server";
import { queueJob } from "@src/util/queueJob";
import { io } from "@src/index";

export function getGoogleOAuth2RedirectUri(requestProtocol: string): string {
    const port = EnvVars.port;
    const includePort = port !== 80 && port !== 443;
    const portString = includePort ? `:${port}` : "";
    return `${requestProtocol}://${EnvVars.host}${portString}${FullPaths.YouTube.Auth.Callback}`;
}

export async function getGoogleOAuth2Client(requestProtocol: string): Promise<OAuth2Client> {
    const settings = await getSettings();
    const secrets = await getSecrets();

    // @ts-ignore
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
    return await queueJob(prisma, graphileWorkerUtils.addJob, io, title, UPLOAD_VIDEO, {
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
