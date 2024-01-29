export interface YouTubeVideoUploadSuccess {
    videoId: string,
    videoUrl: string,
}

export interface YouTubeVideoUploadError {
    error: string,
}

export interface YouTubeVideoUploadInSandboxMode {
    sandboxMode: true,
}

export function isYouTubeVideoUploadSuccess(obj: object): obj is YouTubeVideoUploadSuccess {
    return !!(obj as YouTubeVideoUploadSuccess).videoId;
}

export function isYouTubeVideoUploadError(obj: object): obj is YouTubeVideoUploadError {
    return !!(obj as YouTubeVideoUploadError).error;
}

export function isYouTubeVideoUploadInSandboxMode(obj: object): obj is YouTubeVideoUploadInSandboxMode {
    return (obj as YouTubeVideoUploadInSandboxMode).sandboxMode;
}
