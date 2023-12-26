import { type JobHelpers } from "graphile-worker";

export async function addTbaAssociation(payload: unknown, { logger }: JobHelpers): Promise<void> {
    const waitTime = Math.floor(Math.random() * 5000) + 5000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
}
