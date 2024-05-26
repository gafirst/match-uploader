export interface LiveModeRequirements {
  settingsLoaded: boolean;
  startingMatchKeyKnown: boolean;
  doubleElimPlayoffs: boolean;
  replayDisabled: boolean;
}

export type LiveModeUnsatisfiedRequirements = [keyof LiveModeRequirements];

export function liveModeRequirementToUiString(requirement: string): string | null {
  const outputMap: Record<keyof LiveModeRequirements, string> = {
    settingsLoaded: "Settings loaded",
    startingMatchKeyKnown: "Starting match is selected below",
    doubleElimPlayoffs:
      "Playoffs type is double eliminations",
    replayDisabled: "Replay flag is disabled in the upload form",
  };

  if (!Object.hasOwn(outputMap, requirement)) {
    console.error(`liveModeRequirementToUiString: No UI string provided for requirement: ${requirement}`);
    return null;
  }

  return outputMap[requirement as keyof LiveModeRequirements];
}
