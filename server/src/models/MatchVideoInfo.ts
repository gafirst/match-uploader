export class MatchVideoInfo {
    path: string;
    videoLabel: string | null;
    warnings: string[] = [];

    constructor(path: string, videoLabel: string | null) {
        this.path = path;
        this.videoLabel = videoLabel;
    }

    toJson(): object {
        return {
            path: this.path,
            videoLabel: this.videoLabel,
        };
    }
}
