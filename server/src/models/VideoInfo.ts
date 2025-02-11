import { VideoType } from "./VideoType";

export class VideoInfo {
    path: string;
    videoLabel: string | null;
    videoTitle: string;
    isUploaded: boolean;
    videoType: VideoType;

    constructor(path: string,
      videoLabel: string | null,
      videoTitle: string,
      isUploaded: boolean = false,
      videoType: VideoType = VideoType.MatchVideo,
      ) {
        this.path = path;
        this.videoLabel = videoLabel;
        this.videoTitle = videoTitle;
        this.isUploaded = isUploaded;
        this.videoType = videoType;
    }

    static getVideoLabelFromPath(path: string): string | null {
        if (!path.includes("/")) {
            throw new Error("Expected path to include a subdirectory");
        }

        let videoLabel: string | null = path.split("/")[0];

        // Don't set a video label if the proposed label name is "unlabeled" (case-insensitive)
        if (videoLabel.toLowerCase() === "unlabeled") {
            videoLabel = null;
        }

        return videoLabel;
    }

    toJson(): object {
        return {
            path: this.path,
            videoLabel: this.videoLabel,
            videoTitle: this.videoTitle,
            isUploaded: this.isUploaded,
            videoType: this.videoType,
        };
    }
}
