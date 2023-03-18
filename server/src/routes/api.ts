import { Router } from 'express';

import Paths from './constants/Paths';
import {settingsRouter} from "@src/routes/settings";

const apiRouter = Router();

apiRouter.use(Paths.Settings.Base, settingsRouter);

export default apiRouter;
