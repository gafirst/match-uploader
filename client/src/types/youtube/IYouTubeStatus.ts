import {IYouTubeChannel} from "@/types/youtube/IYouTubeChannel";

export interface IYouTubeStatus {
    ok: boolean
    channels: IYouTubeChannel[]
}
