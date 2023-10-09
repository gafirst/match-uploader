
export interface YouTubeVideoUploadSuccess {
    videoId: string,
    videoUrl: string,
}

export interface YouTubeVideoUploadError {
    error: string,
}

export function isYouTubeVideoUploadSuccess(obj: object): obj is YouTubeVideoUploadSuccess {
    return !!(obj as YouTubeVideoUploadSuccess).videoId;
}

export function isYouTubeVideoUploadError(obj: object): obj is YouTubeVideoUploadError {
    return !!(obj as YouTubeVideoUploadError).error;
}
