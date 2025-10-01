export interface TbaEvent {
  reason: string;
  icon?: string;
  city: string;
  country: string;
  district: {
    abbreviation: string;
    display_name: string;
    key: string;
    year: number;
  } | null;
  end_date: string;
  event_type: number;
  key: string;
  name: string;
  start_date: string;
  state_prov: string;
  year: number;
}

export function isTbaEventsArray(events: unknown): events is TbaEvent[] {
  return Array.isArray(events) && events.every(isTbaEvent);
}

export function isTbaEvent(event: unknown): event is TbaEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    typeof event.reason === "string" &&
    (typeof event.icon === "string" || event.icon === undefined) &&
    typeof event.city === "string" &&
    typeof event.country === "string" &&
    (event.district === null || (
      typeof event.district === "object" &&
      typeof event.district.abbreviation === "string" &&
      typeof event.district.display_name === "string" &&
      typeof event.district.key === "string" &&
      typeof event.district.year === "number"
    )) &&
    typeof event.end_date === "string" &&
    typeof event.event_type === "number" &&
    typeof event.key === "string" &&
    typeof event.name === "string" &&
    typeof event.start_date === "string" &&
    typeof event.state_prov === "string" &&
    typeof event.year === "number"
  );
}
