import { Router } from "express";

import Paths from "./constants/Paths";
import { settingsRouter } from "@src/routes/settings";
import { youTubeRouter } from "@src/routes/youtube";

const apiRouter = Router();

apiRouter.use(Paths.Settings.Base, settingsRouter);
apiRouter.use(Paths.YouTube.Base, youTubeRouter);
export default apiRouter;
