import { Router } from "express";
import { type IReq, type IRes } from "@src/routes/types/types";
import {
  deleteYouTubePlaylistMapping,
  getSecrets,
  getSettings,
  getYouTubePlaylists,
  setSecret,
  setSetting,
  setYouTubePlaylist,
} from "@src/services/SettingsService";
import Paths from "@src/routes/constants/Paths";
import {
  cachePlaylistNames,
  getAuthenticatedYouTubeChannels,
  getGoogleOAuth2RedirectUri,
  getOAuth2AuthUrl, getSampleVideoTitles,
  oauth2AuthCodeExchange, queueYouTubeVideoUpload,
} from "@src/services/YouTubeService";
import logger from "jet-logger";
import { body, matchedData, param, query, validationResult } from "express-validator";
import { type YouTubeVideoPrivacy } from "@src/models/YouTubeVideoPrivacy";
import MatchKey from "@src/models/MatchKey";
import { type PlayoffsType } from "@src/models/PlayoffsType";
import { VideoType } from "@src/models/VideoType";

export const youTubeRouter = Router();
export const youTubeAuthRouter = Router();
youTubeRouter.use(Paths.YouTube.Auth.Base, youTubeAuthRouter);

youTubeAuthRouter.get(
  Paths.YouTube.Auth.Status,
  getYouTubeAuthState,
);

async function getYouTubeAuthState(req: IReq, res: IRes): Promise<void> {
  const [settings, secrets] = await Promise.all([getSettings(), getSecrets()]);

  res.json({
    clientIdProvided: settings.googleClientId.length > 0,
    clientSecretProvided: secrets.googleClientSecret.length > 0,
    accessTokenStored: secrets.googleAccessToken.length > 0,
    refreshTokenStored: secrets.googleRefreshToken.length > 0,
  });
}

youTubeAuthRouter.get(
  Paths.YouTube.Auth.Start,
  startYouTubeOAuth2Flow,
);

async function startYouTubeOAuth2Flow(req: IReq, res: IRes): Promise<void> {
  await setSetting("googleAuthStatus", "OAuth2 flow started");

  res.redirect(await getOAuth2AuthUrl(req.protocol));
}

youTubeAuthRouter.get(
  Paths.YouTube.Auth.RedirectUri,
  returnYouTubeOAuth2RedirectUri,
);

function returnYouTubeOAuth2RedirectUri(req: IReq, res: IRes): void {
  res.json({
    redirectUri: getGoogleOAuth2RedirectUri(req.protocol),
  });
}

youTubeAuthRouter.get(
  Paths.YouTube.Auth.Callback,
  handleYouTubeOAuth2Callback,
);

async function handleYouTubeOAuth2Callback(req: IReq, res: IRes): Promise<void> {
  logger.info(`OAuth2 callback: ${req.query.code} / ${req.query.error}`);

  const {
    code,
    error,
  } = req.query;

  if (code) {
    logger.info("OAuth2 completed successfully");

    try {
      const {
        access_token,
        refresh_token,
        expiry_date,
      } = await oauth2AuthCodeExchange(code as string, req.protocol);

      if (access_token) {
        await setSecret("googleAccessToken", access_token);
        await setSetting("googleAuthStatus", "YouTube connection successful");
      } else {
        await setSetting("googleAuthStatus", "Code exchange failed: no access_token received");
        await setSecret("googleAccessToken", "");
      }
      if (refresh_token) {
        await setSecret("googleRefreshToken", refresh_token);
      } else {
        await setSecret("googleRefreshToken", "");
        logger.warn("OAuth2 code exchange: no refresh_token was received. Google only sends the refresh " +
          "token on the first authorization attempt.");
      }

      if (expiry_date) {
        await setSecret("googleTokenExpiry", expiry_date.toString());
      } else {
        await setSecret("googleTokenExpiry", "");
        logger.warn("OAuth2 code exchange: no expiry_date was received.");
      }
    } catch (codeExchangeError) {
      await setSetting("googleAuthStatus", `YouTube connection failed: ${codeExchangeError}`);
    }
  } else if (error) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    await setSetting("googleAuthStatus", `YouTube connection failed: ${error}`);
  }

  res.redirect("/settings");
}

youTubeAuthRouter.get(
  Paths.YouTube.Auth.Reset,
  resetSavedYouTubeAuthCredentials,
);

async function resetSavedYouTubeAuthCredentials(req: IReq, res: IRes): Promise<void> {
  await setSecret("googleClientSecret", "");
  await setSecret("googleAccessToken", "");
  await setSecret("googleRefreshToken", "");
  await setSetting("googleClientId", "");
  await setSetting("googleAuthStatus", "Not started");

  res.json({
    ok: true,
  });
}

youTubeRouter.get(
  Paths.YouTube.Status,
  getYouTubeStatus,
);

async function getYouTubeStatus(req: IReq, res: IRes): Promise<void> {
  res.json({
    ok: true,
    channels: await getAuthenticatedYouTubeChannels(),
  });
}

youTubeRouter.post(
  Paths.YouTube.Upload,
  body("videoType").default(VideoType.MatchVideo).isIn([VideoType.MatchVideo, VideoType.EventMedia]),
  body(
    "matchKey",
    "Match key is required and must pass a format test. (See MatchKey class for regex.)",
  ).if(body("videoType").equals(VideoType.MatchVideo))
    .isString()
    .matches(MatchKey.matchKeyRegex),
  body("videoTitle", "Title of the YouTube video is required").isString().trim(),
  body("videoPath", "File name of video to upload, which should exist in the server videos directory, is required")
    .isString()
    .trim(),
  body("label", "Video label (e.g., Unlabeled, Overhead) is required").isString().trim(),
  body("description", "Exact video description for the YouTube video is required").isString().trim(),
  body("videoPrivacy", "YouTube video privacy setting is required. Choose from `public`, `unlisted`, or `private`")
    .isIn([
      "public",
      "unlisted",
      "private",
    ])
    .trim(),
  body("forceAddToAllPlaylists", "forceAddToAllPlaylists must be a boolean value")
    .default(false)
    .isBoolean().toBoolean(),
  uploadToYouTube,
);

async function uploadToYouTube(req: IReq, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const {
    videoType,
    matchKey,
    videoPath,
    videoTitle,
    description,
    videoPrivacy,
    label,
    forceAddToAllPlaylists,
  } = matchedData(req);

  const { eventTbaCode, playoffsType: playoffsTypeRaw } = await getSettings();
  const playoffsType = playoffsTypeRaw as PlayoffsType;

  let matchKeyObject: MatchKey | null = null;
  if (matchKey) {
    matchKeyObject = MatchKey.fromString(matchKey as string, playoffsType);
  }

  const workerJob = await queueYouTubeVideoUpload(
    videoType as VideoType,
    videoTitle as string,
    description as string,
    videoPath as string,
    videoPrivacy as YouTubeVideoPrivacy,
    matchKeyObject,
    eventTbaCode,
    label as string,
    forceAddToAllPlaylists as boolean,
  );

  res.json({
    ok: true,
    workerJob,
  });
}

youTubeRouter.get(
  Paths.YouTube.Playlists,
  getLabelPlaylistMapping,
);

async function getLabelPlaylistMapping(req: IReq, res: IRes): Promise<void> {
  const updateSuccess = await cachePlaylistNames();

  if (!updateSuccess) {
    res.status(500).json({
      ok: false,
      error: "Failed to get playlist names",
    });
    return;
  }

  const playlists = await getYouTubePlaylists();

  res.json({
    ok: true,
    playlists,
  });
}

youTubeRouter.post(
  Paths.YouTube.SavePlaylistMapping,
  param("videoLabel", "Video label to update playlist mapping for is required and must be a string")
    .isString()
    .toLowerCase(),
  body("playlistId", "Playlist ID to map to is required, must start with PL, and must only contain " +
    "the characters A-Za-z0-9 _-")
    .exists({ checkNull: true })
    .matches(/^PL[A-Za-z0-9_-]+$/)
    .trim(),
  updatePlaylistMapping,
);

async function updatePlaylistMapping(req: IReq<{ value: string }>, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const {
    videoLabel,
    playlistId,
  } = matchedData(req);

  await setYouTubePlaylist(videoLabel as string, playlistId as string);

  res.json({
    ok: true,
  });
}

youTubeRouter.delete(
  Paths.YouTube.SavePlaylistMapping,
  param("videoLabel", "Video label to update playlist mapping for is required and must be a string")
    .isString(),
  deletePlaylistMapping,
);

async function deletePlaylistMapping(req: IReq<{ value: string }>, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const { videoLabel } = matchedData(req);

  await deleteYouTubePlaylistMapping(videoLabel as string);

  res.json({
    ok: true,
  });
}

youTubeRouter.get(
  Paths.YouTube.GetSampleVideoTitles,
  query("eventName").isString().trim(),
  getSampleYouTubeVideoTitles,
);

async function getSampleYouTubeVideoTitles(req: IReq, res: IRes): Promise<void> {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400)
      .json({
        errors: errors.array(),
      });
    return;
  }

  const { eventName } = matchedData(req);

  res.json({
    ok: true,
    data: await getSampleVideoTitles(eventName as string),
  });
}
