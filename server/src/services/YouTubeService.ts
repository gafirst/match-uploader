import { auth } from '@googleapis/youtube';
import {getSecrets, getSettings} from '@src/services/SettingsService';
import logger from 'jet-logger';
import {type Credentials, type OAuth2Client} from 'google-auth-library';


export async function getGoogleOAuth2Client(): Promise<OAuth2Client> {
  const settings = await getSettings();
  const secrets = await getSecrets();

  return new auth.OAuth2(
    settings.googleClientId,
    secrets.googleClientSecret,
    settings.googleRedirectUri,
  );
}

export async function getOAuth2AuthUrl(): Promise<string> {
  const client = await getGoogleOAuth2Client();

  const scope = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.upload',
  ];

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    include_granted_scopes: true,
    scope,
  });
  logger.info(authUrl);
  return authUrl;
}

export async function oauth2AuthCodeExchange(code: string): Promise<Credentials> {
  const client = await getGoogleOAuth2Client();

  const { tokens } = await client.getToken(code);

  return tokens;
}
