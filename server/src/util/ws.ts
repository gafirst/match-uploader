import { type Socket } from "socket.io";
import {
    type ClientToServerEvents,
    WORKER_JOB_COMPLETE,
    WORKER_JOB_START,
} from "@src/tasks/types/events";
import { processWorkerEvent } from "@src/services/WorkerService";

/**
 * Forwards worker events to clients by broadcasting them as "worker" events. This consolidates worker events
 * into a single channel and avoids a socket.io limitation that clients cannot broadcast to other clients directly.
 *
 * @param socket The socket.io socket
 */
export function configureSocketIoEventForwarding(socket: Socket): void {
    const eventsToForward: Array<keyof ClientToServerEvents> = [
        WORKER_JOB_START,
        WORKER_JOB_COMPLETE,
    ];

    eventsToForward.forEach((event: keyof ClientToServerEvents) => {
        socket.on(event, async (data: ClientToServerEvents[typeof event]) => {
            await processWorkerEvent(event, data, socket);
        });
    });
}
