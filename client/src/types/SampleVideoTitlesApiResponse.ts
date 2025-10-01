export interface SampleVideoTitlesApiResponse {
  ok: boolean;
  data: SampleVideoTitlesData;
}

export interface SampleVideoTitlesData {
  matchTitlesCheck: MatchTitlesCheck;
  eventNameChecks: EventNameCheck;
  passed: boolean;
}

export interface MatchTitlesCheck {
  titles: SampleTitleCheck[];
  passed: boolean;
}

export interface SampleTitleCheck {
  matchTitle: string;
  cutOffTitle: string;
  remainder: string;
  length: number;
  lengthOk: boolean;
}

export interface EventNameCheck {
  spellCheck: SpellCheckResult[];
  passed: boolean;
}

export interface SpellCheckResult {
  word: string;
  ok: boolean;
}

export function isSampleVideoTitlesApiResponse(x: unknown): x is SampleVideoTitlesApiResponse {
  return typeof x === "object" &&
    x !== null &&
    "ok" in (x as SampleVideoTitlesApiResponse) &&
    isSampleVideoTitlesData((x as SampleVideoTitlesApiResponse).data);
}

export function isSampleVideoTitlesData(x: unknown): x is SampleVideoTitlesData {
  return typeof x === "object" &&
    x !== null &&
    isMatchTitlesCheck((x as SampleVideoTitlesData).matchTitlesCheck) &&
    isEventNameCheck((x as SampleVideoTitlesData).eventNameChecks) &&
    "passed" in (x as SampleVideoTitlesData);
}

export function isMatchTitlesCheck(x: unknown): x is MatchTitlesCheck {
  return typeof x === "object" &&
    x !== null &&
    Array.isArray((x as MatchTitlesCheck).titles) &&
    (x as MatchTitlesCheck).titles.every(isSampleTitleCheck) &&
    "passed" in (x as MatchTitlesCheck);
}

export function isSampleTitleCheck(x: unknown): x is SampleTitleCheck {
  return typeof x === "object" &&
    x !== null &&
    !!(x as SampleTitleCheck).matchTitle &&
    !!(x as SampleTitleCheck).cutOffTitle &&
    "remainder" in (x as SampleTitleCheck) &&
    !!(x as SampleTitleCheck).length &&
    "lengthOk" in (x as SampleTitleCheck);
}

export function isEventNameCheck(x: unknown): x is EventNameCheck {
  return typeof x === "object" &&
    x !== null &&
    Array.isArray((x as EventNameCheck).spellCheck) &&
    (x as EventNameCheck).spellCheck.every(isSpellCheckResult) &&
    "passed" in (x as EventNameCheck);
}

export function isSpellCheckResult(x: unknown): x is SpellCheckResult {
  return typeof x === "object" &&
    x !== null &&
    !!(x as SpellCheckResult).word &&
    "ok" in (x as SpellCheckResult);
}
