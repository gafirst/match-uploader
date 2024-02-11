import { Router } from "express";

import Paths from "./constants/Paths.ts";
import { matchesRouter } from "#src/routes/matches.ts";
import { settingsRouter } from "#src/routes/settings.ts";
import { youTubeRouter } from "#src/routes/youtube.ts";
import { workerRouter } from "#src/routes/worker.ts";

const apiRouter = Router();

apiRouter.use(Paths.Matches.Base, matchesRouter);
apiRouter.use(Paths.Settings.Base, settingsRouter);
apiRouter.use(Paths.Worker.Base, workerRouter);
apiRouter.use(Paths.YouTube.Base, youTubeRouter);

export default apiRouter;
