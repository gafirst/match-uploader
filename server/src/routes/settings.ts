import {Router} from "express";
import Paths from "@src/routes/constants/Paths";
import {IReq, IRes} from "@src/routes/types/types";
import {getSettings, setSecret, setSetting} from "@src/services/SettingsService";
import {body, matchedData, param, validationResult} from "express-validator";

export const settingsRouter = Router();

settingsRouter.get(
	Paths.Settings.List,
	listSettings,
);

async function listSettings(req: IReq, res: IRes) {
	return res.json(await getSettings());
}

settingsRouter.post(
	Paths.Settings.Update,
	param("name", "Setting name to be updated is required and must be a string").isString(),
	body("value", "New setting value is required and must be a string").isString().trim(),
	body("settingType", "Type must be 'setting' or 'secret' to indicate desired storage location")
		.isIn(["setting", "secret"])
		.trim(),
	updateSetting,
)

async function updateSetting(req: IReq<{ value: string }>, res: IRes) {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400)
			.json({
				errors: errors.array(),
			});
	}

	const {name, value, settingType} = matchedData(req);

	if (settingType === "secret") {
		await setSecret(name, value);
	} else {
		await setSetting(name, value);
	}

	return res.json({
		ok: true,
	});
}
