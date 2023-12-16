import "./pre-start"; // Must be the first import
import logger from "jet-logger";

import EnvVars from "@src/constants/EnvVars";
import { appPromise } from "./server";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { configureSocketIoEventForwarding } from "@src/util/ws";

const SERVER_START_MSG = `Express server started on port: ${EnvVars.port}`;
export let io: SocketIOServer;
appPromise.then(app => {
    // https://stackoverflow.com/a/12237273
    const server = http.createServer(app);
    io = new SocketIOServer(server, {
        cors: {
            origin: "http://localhost:3001", // FIXME: figure out how this works in prod
        },
    });

    server.setTimeout(900000); // https://stackoverflow.com/a/52944570 FIXME - test again

    io.on("connection", socket => {
       logger.info(`Socket connected: ${socket.id}`);
       configureSocketIoEventForwarding(socket);
    });

    server.listen(EnvVars.port, () => logger.info(SERVER_START_MSG));
}).catch(error => {
    throw error;
});
