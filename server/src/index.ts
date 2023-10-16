import "./pre-start"; // Must be the first import
import logger from "jet-logger";

import EnvVars from "@src/constants/EnvVars";
import app from "./server";

const SERVER_START_MSG = (`Express server started on port: ${EnvVars.Port.toString()}`);

const server = app.listen(EnvVars.Port, () => logger.info(SERVER_START_MSG));
server.setTimeout(900000); // https://stackoverflow.com/a/52944570
