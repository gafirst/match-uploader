import { Router } from 'express';

import Paths from './constants/Paths';
import {settingsRouter} from "@src/routes/settings";
import {youtubeRouter} from "@src/routes/youtube";

const apiRouter = Router();

apiRouter.use(Paths.Settings.Base, settingsRouter);
apiRouter.use(Paths.YouTube.Base, youtubeRouter);
export default apiRouter;
