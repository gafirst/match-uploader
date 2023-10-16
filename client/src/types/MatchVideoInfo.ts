export interface MatchVideoInfo {
    path: string;
    videoLabel: string | null;
    videoTitle: string;
    skipUpload: boolean;
    uploadInProgress: boolean;
    uploaded: boolean;
    uploadError: string | null;
    youTubeVideoId: string | null;
    youTubeVideoUrl: string | null;
    postUploadSteps: {
      addToYouTubePlaylist: boolean;
      linkOnTheBlueAlliance: boolean;
    } | null;
}
