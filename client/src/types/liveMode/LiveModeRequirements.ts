export interface LiveModeRequirements {
  settingsLoaded: boolean;
  startingMatchKeyKnown: boolean;
  doubleElimPlayoffs: boolean;
}

export type LiveModeUnsatisfiedRequirements = [keyof LiveModeRequirements];

export function liveModeRequirementToUiString(requirement: string): string | null {
  const outputMap: Record<keyof LiveModeRequirements, string> = {
    settingsLoaded: "Settings loaded",
    startingMatchKeyKnown: "Starting match is selected below",
    doubleElimPlayoffs:
      "Playoffs type is double eliminations",
  };

  if (!Object.hasOwn(outputMap, requirement)) {
    return null;
  }

  return outputMap[requirement as keyof LiveModeRequirements];
}
