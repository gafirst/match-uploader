import { type Socket } from "socket.io";
import { WORKER_JOB_COMPLETE, WORKER_JOB_START } from "@src/tasks/types/events";
import { processWorkerEvent } from "@src/services/WorkerService";

/**
 * Forwards worker events to clients by broadcasting them as "worker" events. This consolidates worker events
 * into a single channel and avoids a socket.io limitation that clients cannot broadcast to other clients directly.
 *
 * @param socket The socket.io socket
 */
export function configureSocketIoEventForwarding(socket: Socket): void {
    const eventsToForward = [
        WORKER_JOB_START,
        WORKER_JOB_COMPLETE,
    ];

    const broadcastChannelName = "worker";

    eventsToForward.forEach((event) => {
        socket.on(event, async (data) => {
            socket.broadcast.emit(broadcastChannelName, {
                event,
                ...data,
            });
            await processWorkerEvent(event, data);
        });
    });
}
