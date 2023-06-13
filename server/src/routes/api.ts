import { Router } from "express";

import Paths from "./constants/Paths";
import { matchesRouter } from "@src/routes/matches";
import { settingsRouter } from "@src/routes/settings";
import { youTubeRouter } from "@src/routes/youtube";

const apiRouter = Router();

apiRouter.use(Paths.Matches.Base, matchesRouter);
apiRouter.use(Paths.Settings.Base, settingsRouter);
apiRouter.use(Paths.YouTube.Base, youTubeRouter);
export default apiRouter;
