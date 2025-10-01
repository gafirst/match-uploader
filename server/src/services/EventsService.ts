import { TheBlueAllianceReadRepo } from "@src/repos/TheBlueAllianceReadRepo";
import { getSecrets, getSettings } from "@src/services/SettingsService";
import { DateTime } from "luxon";
import {
  EventAutocompleteApiResponse,
  TbaEventSimple,
  TbaEventSimpleWithReason,
} from "@src/models/theBlueAlliance/tbaEvent";
import logger from "jet-logger";

function compareEvents(eventA: TbaEventSimple, eventB: TbaEventSimple): number {
  return eventA.start_date.toMillis() - eventB.start_date.toMillis() ||
    eventA.name.localeCompare(eventB.name);
}

export async function getCurrentEventsForAutocomplete(): Promise<EventAutocompleteApiResponse> {
  const { eventTbaCode, useFrcEventsApi } = await getSettings();
  const { theBlueAllianceReadApiKey } = await getSecrets();

  if (useFrcEventsApi) {
    logger.warn("Events autocomplete is not supported when using the FRC Events API");
    return {
      sortedEvents: [],
    };
  }

  const tbaRepo = new TheBlueAllianceReadRepo(theBlueAllianceReadApiKey);
  const startOfToday = DateTime.now().startOf("day");

  // Event rankings:
  // 1) The currently selected event
  // 2) Same district, >= start date is today or later
  // 3) Start date >= today or later
  // 4) Sorted by start date
  // 5) Sorted by name

  let currentEvent: TbaEventSimpleWithReason | null = null;

  try {
    if (eventTbaCode) {
      currentEvent = {
        reason: "Current event",
        icon: "mdi-star-outline",
        ...(await tbaRepo.getEvent(eventTbaCode)),
      };
    }
  } catch {
    logger.warn(`Current event with TBA code ${eventTbaCode} not found`);
  }
  const unsortedEvents = await tbaRepo.getEvents(DateTime.now().year);

  const sameDistrictLaterDate: TbaEventSimpleWithReason[] = unsortedEvents.filter((event: TbaEventSimple) => {
    if (!currentEvent || currentEvent.key === event.key) {
      return false;
    }
    return event.district?.key && event.district?.key === currentEvent?.district?.key
      && event.start_date >= startOfToday;
  }).map(event => {
    return {
      reason: "Upcoming district event",
      icon: "mdi-earth",
      ...event,
    };
  })
    .sort(compareEvents);

  const sameDistrictLaterEventKeys = new Set(sameDistrictLaterDate.map((event: TbaEventSimple) => event.key));

  const upcomingEvents: TbaEventSimpleWithReason[] = unsortedEvents.filter((event: TbaEventSimple) => {
    if (currentEvent?.key === event.key || sameDistrictLaterEventKeys.has(event.key)) { return false; }

    return event.start_date >= startOfToday;
  }).map(
    event => {
      return {
        reason: "Upcoming event",
        icon: "mdi-calendar-month-outline",
        ...event,
      };
    }
  ).sort(compareEvents);

  const events: TbaEventSimpleWithReason[] = [];

  if (currentEvent) {
      events.push(currentEvent);
  }

  events.push(...sameDistrictLaterDate);
  events.push(...upcomingEvents);

  const seenEventKeys = new Set(events.map((event: TbaEventSimple) => event.key));

  const remainingEvents: TbaEventSimpleWithReason[] = unsortedEvents.filter((event: TbaEventSimple) => {
    return !seenEventKeys.has(event.key);
  }).map(event => {
    return {
      reason: "Past event",
      ...event,
    };
  }).sort(compareEvents);

  events.push(...remainingEvents);

  return {
    sortedEvents: events,
  };
}
