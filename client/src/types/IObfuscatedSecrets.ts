export interface IObfuscatedSecrets {
    googleClientSecret: boolean,
    googleAccessToken: boolean,
    googleRefreshToken: boolean,
    theBlueAllianceReadApiKey: boolean,
    [key: string]: boolean,
}
