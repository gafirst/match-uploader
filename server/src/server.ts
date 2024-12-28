import morgan from "morgan";
import path from "path";
import helmet from "helmet";
import express, { type Request, type Response, type NextFunction } from "express";
import logger from "jet-logger";

import apiRouter from "@src/routes/api";
import Paths from "@src/routes/constants/Paths";

import EnvVars from "@src/constants/EnvVars";
import HttpStatusCodes from "@src/constants/HttpStatusCodes";

import { NodeEnvs } from "@src/constants/NodeEnvs";
import { RouteError } from "@src/util/http";

import { makeWorkerUtils, type WorkerUtils } from "graphile-worker";
import { PrismaClient } from "@prisma/client";

const app = express();

export const prisma = new PrismaClient();

export let graphileWorkerUtils: WorkerUtils;

// This is some rigamarole to handle the fact that makeWorkerUtils is needed to make the workerUtils singleton but is
// an async function. See https://stackoverflow.com/a/41364294
export const appPromise = makeWorkerUtils({
  connectionString: EnvVars.db.connectionString,
}).then((workerUtils) => {
  graphileWorkerUtils = workerUtils;

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Show routes called in console during development
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  if (EnvVars.nodeEnv === NodeEnvs.Dev) {
    app.use(morgan("dev"));
  }

  // Security
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  if (EnvVars.nodeEnv === NodeEnvs.Production) {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          upgradeInsecureRequests: null,
        },
      },
    }));
  }

  // Add APIs, must be after middleware
  app.use(Paths.Base, apiRouter);

  // Serve frontend
  app.use(express.static(path.join(__dirname, "../../client/dist")));

  // Serve the videos directory at /videos/video-file.mp4
  app.use("/videos", express.static(path.join(__dirname, "../videos")));

  app.get("*path", (request, response) => {
    response.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
  });

  // Add error handler
  app.use((
    err: Error,
    _: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (EnvVars.nodeEnv !== NodeEnvs.Test) {
      logger.err(err, true);
    }
    let status = HttpStatusCodes.BAD_REQUEST;
    if (err instanceof RouteError) {
      status = err.status;
    }
    return res.status(status).json({ error: err.message });
  });

  return app;
}).catch((error) => {
  throw error;
});
