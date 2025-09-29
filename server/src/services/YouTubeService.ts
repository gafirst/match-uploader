import { auth } from "@googleapis/youtube";
import { getSecrets, getSettings, getYouTubePlaylists, setYouTubePlaylist } from "@src/services/SettingsService";
import logger from "jet-logger";
import { type Credentials, type OAuth2Client } from "google-auth-library";
import EnvVars from "@src/constants/EnvVars";
import FullPaths from "@src/routes/constants/FullPaths";
import { type YouTubeChannelList } from "@src/models/YouTubeChannel";
import { type YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import MatchKey from "@src/models/MatchKey";
import { UPLOAD_VIDEO } from "@src/tasks/types/tasks";
import { type WorkerJob } from "@prisma/client";
import { getYouTubeApiClient } from "@src/repos/YouTubeRepo";
import { graphileWorkerUtils, prisma } from "@src/server";
import { queueJob } from "@src/util/queueJob";
import { io } from "@src/index";
import { VideoType } from "@src/models/VideoType";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { Match } from "@src/models/Match";
import { generateMatchVideoTitle } from "@src/services/MatchesService";
import Typo from "typo-js";

export function getGoogleOAuth2RedirectUri(requestProtocol: string): string {
  const port = EnvVars.port;
  const includePort = port !== 80 && port !== 443;
  const portString = includePort ? `:${port}` : "";
  return `${requestProtocol}://${EnvVars.host}${portString}${FullPaths.YouTube.Auth.Callback}`;
}

export async function getGoogleOAuth2Client(requestProtocol: string): Promise<OAuth2Client> {
  const settings = await getSettings();
  const secrets = await getSecrets();

  // @ts-expect-error This OAuth2 client is correct, but the types don't match for unclear reasons that aren't worth
  // investigating right now
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
 * @param videoType
 * @param title
 * @param description
 * @param videoPath
 * @param privacy
 * @param matchKey
 * @param label
 */
export async function queueYouTubeVideoUpload(
  videoType: VideoType,
  title: string,
  description: string,
  videoPath: string,
  privacy: YouTubeVideoPrivacy,
  matchKey: MatchKey | null,
  eventKey: string | null,
  label: string,
): Promise<WorkerJob> {
  return await queueJob(prisma, graphileWorkerUtils.addJob, io, title, UPLOAD_VIDEO, {
    videoType,
    title,
    description,
    videoPath,
    privacy,
    label,
    matchKey: matchKey?.matchKey,
    playoffsType: matchKey?.playoffsType,
    eventKey,
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

export async function getSampleVideoTitles(eventName: string) {
  const spellChecker = new Typo("en_US", null, null, { dictionaryPath: EnvVars.spellCheck.dictBasePath });

  const { spellCheckCustomDictionary } = await getSettings();

  const videoLabels = new Set(Object.keys(await getYouTubePlaylists())).add("unlabeled");
  const { playoffsType } = await getSettings();
  const sampleMatchKeys = [
    "2023test_qm1",
    "2023test_qm10",
    "2023test_qm100",
    "2023test_sf1m1",
    (playoffsType as PlayoffsType) === PlayoffsType.BestOf3 ? "2023test_qf1m1" : "2023test_sf10m1",
    "2023test_f1m1",
  ];

  const replayVariants = [false, true];

  const matchTitles: {
    matchTitle: string
    cutOffTitle: string;
    remainder: string;
    length: number;
    lengthOk: boolean;
  }[] = [];

  for (const matchKey of sampleMatchKeys) {
    for (const videoLabel of videoLabels) {
      for (const isReplay of replayVariants) {
        const match = new Match(MatchKey.fromString(matchKey, playoffsType as PlayoffsType), isReplay);
        const matchTitle = generateMatchVideoTitle(match, eventName, videoLabel === "unlabeled" ? null : videoLabel);

        matchTitles.push({
          matchTitle,
          cutOffTitle: matchTitle.substring(0, 100),
          remainder: matchTitle.substring(100),
          length: matchTitle.length,
          lengthOk: matchTitle.length <= 100,
        });
      }
    }
  }

  const eventNameSpellCheck = eventName.split(" ").map((word) => {
    return {
      word,
      ok: word.match(/^(\d+|[+&-])$/) || spellChecker.check(word.replace(/[()]/g, ""))
        || spellCheckCustomDictionary.split(",").includes(word),
    };
  });

  const spellCheckPassed = eventNameSpellCheck.every((word) => word.ok);
  const matchTitleChecksPassed = matchTitles.every((check) => check.lengthOk);
  return {
    matchTitlesCheck: {
      titles: matchTitles,
      passed: matchTitleChecksPassed,
    },
    eventNameChecks: {
      spellCheck: eventNameSpellCheck,
      passed: spellCheckPassed,
    },
    passed: matchTitleChecksPassed && spellCheckPassed,
  };
}
