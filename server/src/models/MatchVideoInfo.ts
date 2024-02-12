export class MatchVideoInfo {
    path: string;
    videoLabel: string | null;
    videoTitle: string;
    isUploaded: boolean;

    constructor(path: string, videoLabel: string | null, videoTitle: string, isUploaded: boolean = false) {
        this.path = path;
        this.videoLabel = videoLabel;
        this.videoTitle = videoTitle;
        this.isUploaded = isUploaded;
    }

    toJson(): object {
        return {
            path: this.path,
            videoLabel: this.videoLabel,
            videoTitle: this.videoTitle,
            isUploaded: this.isUploaded,
        };
    }
}
