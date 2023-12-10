import { type GraphileHelpers } from "@src/tasks/types/types";

export interface UploadVideoTaskPayload {
    video: string;
}

function assertIsUploadVideoTaskPayload(payload: unknown): asserts payload is UploadVideoTaskPayload {
    if (payload === null) {
        throw new Error(`Invalid payload (null): ${JSON.stringify(payload)}`);
    } else if (typeof payload === "undefined") {
        throw new Error(`Invalid payload (undefined): ${JSON.stringify(payload)}`);
    } else if (!(payload as unknown as UploadVideoTaskPayload).video) {
        throw new Error(`Invalid payload (missing video prop): ${JSON.stringify(payload)}`);
    }
}

export async function uploadVideo(payload: unknown, { logger }: GraphileHelpers): Promise<void> {
    assertIsUploadVideoTaskPayload(payload);
    logger.info("Hi!");
    logger.info(`Uploading video ${payload.video}`);
}
