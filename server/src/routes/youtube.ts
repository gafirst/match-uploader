import {Router} from "express";
import {IReq, IRes} from "@src/routes/types/types";
import {getSettings} from "@src/services/SettingsService";
import Paths from "@src/routes/constants/Paths";

export const youtubeRouter = Router();

youtubeRouter.get(
	Paths.YouTube.Auth.Status,
	getYouTubeAuthStatus,
);

async function getYouTubeAuthStatus(req: IReq, res: IRes) {
	return res.json({
		clientInfo: false,
		authFlow: false,
		tokensStored: false,
	});
}
