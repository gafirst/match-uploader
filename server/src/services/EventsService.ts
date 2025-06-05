import { TheBlueAllianceReadRepo } from "@src/repos/TheBlueAllianceReadRepo";
import { getSecrets } from "@src/services/SettingsService";
import { DateTime } from "luxon";

export async function getCurrentEventsForAutocomplete() {
  const { theBlueAllianceReadApiKey } = await getSecrets();

  return await (new TheBlueAllianceReadRepo(theBlueAllianceReadApiKey)).getEvents(DateTime.now().year);
}
