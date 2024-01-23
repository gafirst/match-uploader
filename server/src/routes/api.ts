import { Router } from "express";

import Paths from "./constants/Paths";
import { matchesRouter } from "@src/routes/matches";
import { settingsRouter } from "@src/routes/settings";
import { youTubeRouter } from "@src/routes/youtube";
import { graphileWorkerUtils } from "@src/server";
import { workerRouter } from "@src/routes/worker";
import { queueJob } from "@src/services/WorkerService";

const apiRouter = Router();

apiRouter.use(Paths.Matches.Base, matchesRouter);
apiRouter.use(Paths.Settings.Base, settingsRouter);
apiRouter.use(Paths.Worker.Base, workerRouter);
apiRouter.use(Paths.YouTube.Base, youTubeRouter);

export default apiRouter;
