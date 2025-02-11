import { Router } from "express";

import Paths from "./constants/Paths";
import { matchesRouter } from "@src/routes/matches";
import { settingsRouter } from "@src/routes/settings";
import { youTubeRouter } from "@src/routes/youtube";
import { workerRouter } from "@src/routes/worker";
import { autoRenameRouter } from "@src/routes/autoRename";
import { eventMediaRouter } from "@src/routes/eventMedia";

const apiRouter = Router();

apiRouter.use(Paths.AutoRename.Base, autoRenameRouter);
apiRouter.use(Paths.Matches.Base, matchesRouter);
apiRouter.use(Paths.EventMedia.Base, eventMediaRouter);
apiRouter.use(Paths.Settings.Base, settingsRouter);
apiRouter.use(Paths.Worker.Base, workerRouter);
apiRouter.use(Paths.YouTube.Base, youTubeRouter);

export default apiRouter;
