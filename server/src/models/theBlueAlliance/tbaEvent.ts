import { DateTime } from "luxon";

export type TbaEventsSimpleApiResponse = TbaEventSimple[];

export interface TbaEventSimple {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  district: TbaDistrict | null;
  city: string | null;
  state_prov: string | null;
  country: string | null;
  start_date: DateTime;
  end_date: DateTime;
  year: number;
}

interface TbaDistrict {
  abbreviation: string;
    display_name: string;
    key: string;
    year: number;
}

export function isTbaEventSimple(obj: object): obj is TbaEventSimple {
  return !!(obj as TbaEventSimple).key &&
    !!(obj as TbaEventSimple).name &&
    !!(obj as TbaEventSimple).event_code &&
    typeof (obj as TbaEventSimple).event_type === "number" &&
    isTbaDistrict((obj as TbaEventSimple).district) &&
    !!(obj as TbaEventSimple).start_date &&
    !!(obj as TbaEventSimple).end_date &&
    typeof (obj as TbaEventSimple).year === "number";
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
