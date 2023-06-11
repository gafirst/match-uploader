import { auth } from '@googleapis/youtube';
import {getSecrets, getSettings} from '@src/services/SettingsService';
import logger from 'jet-logger';
import {type Credentials, type OAuth2Client} from 'google-auth-library';
import EnvVars from "@src/constants/EnvVars";
import FullPaths from "@src/routes/constants/FullPaths";

export function getGoogleOAuth2RedirectUri(requestProtocol: string): string {
  const port = EnvVars.Port;
  const includePort = port !== '80' && port !== '443';
  const portString = includePort ? `:${port}` : '';
  return `${requestProtocol}://${EnvVars.Host}${portString}${FullPaths.YouTube.AuthCallback}`;
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

export async function oauth2AuthCodeExchange(code: string, requestProtocol: string): Promise<Credentials> {
  const client = await getGoogleOAuth2Client(requestProtocol);

  const { tokens } = await client.getToken(code);

  return tokens;
}
