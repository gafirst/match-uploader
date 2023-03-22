export interface IJsonSettings {
	[key: string]: any
}

export interface ISettings {
	eventName: string,
	eventTbaCode: string,
	videoSearchDirectory: string,
	googleClientId: string,
	googleClientSecret: string,
}

export interface ISetting {
	name: string,
	value: string,
}
