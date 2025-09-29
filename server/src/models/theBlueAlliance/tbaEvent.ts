import { DateTime } from "luxon";

export type TbaEventsSimpleApiResponse = TbaEventSimpleApiResponse[];

export interface TbaEventSimpleApiResponse {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  district: TbaDistrict | null;
  city: string | null;
  state_prov: string | null;
  country: string | null;
  start_date: string;
  end_date: string;
  year: number;
}

// Omit: https://stackoverflow.com/a/69277054
export interface TbaEventSimple extends Omit<TbaEventSimpleApiResponse, "start_date" | "end_date"> {
  start_date: DateTime;
  end_date: DateTime;
}

export interface TbaEventSimpleWithReason extends TbaEventSimple {
  reason: string;
  icon?: string;
}

export interface EventAutocompleteApiResponse {
  sortedEvents: TbaEventSimpleWithReason[];
}

interface TbaDistrict {
  abbreviation: string;
    display_name: string;
    key: string;
    year: number;
}

export function isTbaEventSimple(obj: object): obj is TbaEventSimpleApiResponse {
  return !!(obj as TbaEventSimpleApiResponse).key &&
    !!(obj as TbaEventSimpleApiResponse).name &&
    !!(obj as TbaEventSimpleApiResponse).event_code &&
    typeof (obj as TbaEventSimpleApiResponse).event_type === "number" &&
    isTbaDistrict((obj as TbaEventSimpleApiResponse).district) &&
    !!(obj as TbaEventSimpleApiResponse).start_date &&
    !!(obj as TbaEventSimpleApiResponse).end_date &&
    typeof (obj as TbaEventSimpleApiResponse).year === "number";
}

export function isTbaDistrict(obj: object | null): obj is TbaDistrict {
  if (obj === null) {
    return true;
  }

  return !!(obj as TbaDistrict).abbreviation &&
    !!(obj as TbaDistrict).display_name &&
    !!(obj as TbaDistrict).key &&
    typeof (obj as TbaDistrict).year === "number";
}

export function augmentTbaEventDates(event: TbaEventSimpleApiResponse): TbaEventSimple {
  return {
    ...event,
    start_date: DateTime.fromISO(event.start_date).startOf("day"),
    end_date: DateTime.fromISO(event.end_date).endOf("day"),
  };
}
