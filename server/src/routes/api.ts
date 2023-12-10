import { Router } from "express";

import Paths from "./constants/Paths";
import { matchesRouter } from "@src/routes/matches";
import { settingsRouter } from "@src/routes/settings";
import { youTubeRouter } from "@src/routes/youtube";
import { graphileWorkerUtils } from "@src/server";

const apiRouter = Router();
apiRouter.get("/test", async (request, response) => {
   await graphileWorkerUtils.addJob("uploadVideo", { video: "test" });
   return response.json("ok");
});

apiRouter.use(Paths.Matches.Base, matchesRouter);
apiRouter.use(Paths.Settings.Base, settingsRouter);
apiRouter.use(Paths.YouTube.Base, youTubeRouter);

export default apiRouter;
