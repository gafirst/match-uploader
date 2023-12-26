import { type JobHelpers } from "graphile-worker";

export interface AddToYouTubePlaylistPayload {
    // TODO: unsure if we can/should pass additional info like the match label here.
}

function assertIsYouTubePlaylistPayload(payload: unknown): asserts payload is AddToYouTubePlaylistPayload {
    if (payload === null) {
        throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
    } else if (typeof payload === "undefined") {
        throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
    }
    // TODO
    // else if (!(payload as unknown as UploadVideoTaskPayload).title ||
    //     !(payload as unknown as UploadVideoTaskPayload).description ||
    //     !(payload as unknown as UploadVideoTaskPayload).videoPath) {
    //     throw new Error(`Invalid payload (missing required prop): ${JSON.stringify(payload)}`);
    // }
}

export async function addToYouTubePlaylist(payload: unknown, { logger }: JobHelpers): Promise<void> {
    assertIsYouTubePlaylistPayload(payload);

    const waitTime = Math.floor(Math.random() * 5000) + 5000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
}
