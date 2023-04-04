import {Router} from 'express';
import {type IReq, type IRes} from '@src/routes/types/types';
import {getSecrets, getSettings, setSecret, setSetting} from '@src/services/SettingsService';
import Paths from '@src/routes/constants/Paths';
import {getOAuth2AuthUrl, oauth2AuthCodeExchange} from '@src/services/YouTubeService';
import logger from 'jet-logger';

export const youTubeRouter = Router();

youTubeRouter.get(
  Paths.YouTube.AuthStatus,
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

youTubeRouter.get(
  Paths.YouTube.AuthStart,
  startYouTubeOAuth2Flow,
);

async function startYouTubeOAuth2Flow(req: IReq, res: IRes): Promise<void> {
  await setSetting('googleAuthStatus', 'OAuth2 flow started');

  res.redirect(await getOAuth2AuthUrl());
}

youTubeRouter.get(
  Paths.YouTube.AuthCallback,
  handleYouTubeOAuth2Callback,
);

async function handleYouTubeOAuth2Callback(req: IReq, res: IRes): Promise<void> {
  logger.info(`OAuth2 callback: ${req.query.code} / ${req.query.error}`);

  const { code, error } = req.query;

  if (code) {
    logger.info('OAuth2 completed successfully');

    try {
      const { access_token, refresh_token } = await oauth2AuthCodeExchange(code as string);
      if (access_token) {
        await setSecret('googleAccessToken', access_token);
        await setSetting('googleAuthStatus', 'YouTube connection successful');
      } else {
        await setSetting('googleAuthStatus', 'Code exchange failed: no access_token received');
        await setSecret('googleAccessToken', '');
      }
      if (refresh_token) {
        await setSecret('googleRefreshToken', refresh_token);
      } else {
        await setSecret('googleRefreshToken', '');
        logger.warn('OAuth2 code exchange: no refresh_token was received. Google only sends the refresh ' +
            'token on the first authorization attempt.');
      }
    } catch (codeExchangeError) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      await setSetting('googleAuthStatus', `YouTube connection failed: ${codeExchangeError}`);
    }
  } else if (error) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    await setSetting('googleAuthStatus', `YouTube connection failed: ${error}`);
  }

  res.redirect('/settings');
}

youTubeRouter.get(
  Paths.YouTube.AuthReset,
  resetSavedYouTubeAuthCredentials,
);

async function resetSavedYouTubeAuthCredentials(req: IReq, res: IRes): Promise<void> {
  await setSecret('googleClientSecret', '');
  await setSecret('googleAccessToken', '');
  await setSecret('googleRefreshToken', '');
  await setSetting('googleClientId', '');
  await setSetting('googleAuthStatus', 'Not started');

  res.json({
    ok: true,
  });
}
