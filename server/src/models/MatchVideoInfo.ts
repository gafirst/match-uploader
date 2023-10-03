export class MatchVideoInfo {
    path: string;
    videoLabel: string | null;
    videoTitle: string;

    constructor(path: string, videoLabel: string | null, videoTitle: string) {
        this.path = path;
        this.videoLabel = videoLabel;
        this.videoTitle = videoTitle;
    }

    toJson(): object {
        return {
            path: this.path,
            videoLabel: this.videoLabel,
            videoTitle: this.videoTitle,
        };
    }
}
