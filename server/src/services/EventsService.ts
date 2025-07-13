import { TheBlueAllianceReadRepo } from "@src/repos/TheBlueAllianceReadRepo";
import { getSecrets, getSettings } from "@src/services/SettingsService";
import { DateTime } from "luxon";
import { TbaEventSimple } from "@src/models/theBlueAlliance/tbaEvent";

function compareEvents(eventA: TbaEventSimple, eventB: TbaEventSimple): number {
  return eventA.start_date.toMillis() - eventB.start_date.toMillis() ||
    eventA.name.localeCompare(eventB.name);
}

export async function getCurrentEventsForAutocomplete() {
  const { eventTbaCode } = await getSettings();
  const { theBlueAllianceReadApiKey } = await getSecrets();
  const tbaRepo = new TheBlueAllianceReadRepo(theBlueAllianceReadApiKey);

  // Event rankings:
  // 1) The currently selected event
  // 2) Same district, >= start date as current event
  // 3) Start date >= current event start date
  // 4) Sorted by start date
  // 5) Sorted by name

  const currentEvent = eventTbaCode ?
    { reason: "Current event", ...(await tbaRepo.getEvent(eventTbaCode)) } : null;
  const unsortedEvents = await tbaRepo.getEvents(DateTime.now().year);

  const sameDistictLaterDate = unsortedEvents.filter((event: TbaEventSimple) => {
    if (!currentEvent || currentEvent.key === event.key) {
      return false;
    }
    return event.district?.key === currentEvent?.district?.key && event.start_date >= currentEvent.start_date;
  }).map(event => {
    return {
      reason: "Upcoming district event",
      ...event,
    };
  })
    .sort(compareEvents);

  const sameDistrictLaterEventKeys = new Set(sameDistictLaterDate.map((event: TbaEventSimple) => event.key));

  const upcomingEvents = unsortedEvents.filter((event: TbaEventSimple) => {
    if (!currentEvent || sameDistrictLaterEventKeys.has(event.key)) { return false; }

    return event.start_date >= currentEvent.start_date;
  }).map(
    event => {
      return {
        reason: "Upcoming event",
        ...event,
      };
    }
  ).sort(compareEvents);

  const events: TbaEventSimple[] = [];

  if (currentEvent) {
      events.push(currentEvent);
  }

  events.push(...sameDistictLaterDate);
  events.push(...upcomingEvents);

  const seenEventKeys = new Set(events.map((event: TbaEventSimple) => event.key));

  const remainingEvents = unsortedEvents.filter((event: TbaEventSimple) => {
    return !seenEventKeys.has(event.key);
  }).map(event => {
    return {
      reason: "Past event",
      ...event,
    }
  }).sort(compareEvents);

  events.push(...remainingEvents);

  return events;
}
