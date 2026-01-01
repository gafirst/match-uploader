import "./pre-start"; // Must be the first import
import logger from "jet-logger";

import EnvVars from "@src/constants/EnvVars";
import { appPromise } from "./server";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { configureSocketIoEventForwarding } from "@src/util/ws";
import { type ClientToServerEvents, type ServerToClientEvents } from "./tasks/types/events";

export let io: SocketIOServer;

appPromise.then(app => {
    // https://stackoverflow.com/a/12237273
    const server = http.createServer(app);
    io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
        cors: {
            origin: "http://localhost:3001", // This resolves CORS issues during local development
        },
    });

    server.setTimeout(900000); // https://stackoverflow.com/a/52944570

    io.on("connection", socket => {
       logger.info(`Socket connected: ${socket.id}`);
       configureSocketIoEventForwarding(socket);
    });

    server.listen(EnvVars.port, () => {
      logger.info(`Express server started on port: ${EnvVars.port}`);
      logger.info(`match-uploader-backend version ${EnvVars.version}`);
    });
}).catch(error => {
    throw error;
});
