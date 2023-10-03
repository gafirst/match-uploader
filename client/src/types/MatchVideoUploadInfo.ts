import {YouTubeVideoPrivacy} from "@/types/youtube/YouTubeVideoPrivacy";

// TODO(evan10s): idk if these should allow nulls
export interface MatchVideoUploadInfo {
    videoTitle: string | null;
    path: string | null;
    description: string | null;
    videoPrivacy: YouTubeVideoPrivacy;
    uploadInProgress?: boolean;
    uploadSuccess?: boolean;
    uploadError?: string;
}
