export const PRACTICE = "Practice";
export const QUALIFICATION = "Qualification";
export const PLAYOFF_DOUBLE_ELIM = "Double elimination playoff";
export const PLAYOFF_BEST_OF_3 = "Best of 3 playoff";

export type MatchType = typeof PRACTICE
  | typeof QUALIFICATION
  | typeof PLAYOFF_DOUBLE_ELIM
  | typeof PLAYOFF_BEST_OF_3;

export const MATCH_TYPES: MatchType[] = [
  PRACTICE,
  QUALIFICATION,
  PLAYOFF_DOUBLE_ELIM,
  PLAYOFF_BEST_OF_3,
];

export type PlayoffMatchType = typeof PLAYOFF_DOUBLE_ELIM
  | typeof PLAYOFF_BEST_OF_3;

export const PLAYOFF_MATCH_TYPES: PlayoffMatchType[] = [
  PLAYOFF_DOUBLE_ELIM,
  PLAYOFF_BEST_OF_3,
];
