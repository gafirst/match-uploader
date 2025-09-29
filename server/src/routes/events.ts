// A hello world router for events
import { Router } from "express";
import Paths from "@src/routes/constants/Paths";
import { IReq, IRes } from "@src/routes/types/types";
import { getCurrentEventsForAutocomplete } from "@src/services/EventsService";

export const eventsRouter = Router();

eventsRouter.get(
    Paths.Events.Autocomplete,
    getEventsAutocomplete,
);

async function getEventsAutocomplete(req: IReq, res: IRes): Promise<void> {
    res.json({
        ok: true,
        events: await getCurrentEventsForAutocomplete(),
    });
}
