export interface IObfuscatedSecrets {
    googleClientSecret: boolean,
    googleAccessToken: boolean,
    googleRefreshToken: boolean,
    theBlueAllianceReadApiKey: boolean,
    theBlueAllianceTrustedApiAuthId: boolean,
    theBlueAllianceTrustedApiAuthSecret: boolean,
    [key: string]: boolean,
}
