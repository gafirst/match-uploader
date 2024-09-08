export enum AutoRenameAssociationStatus {
  // No association has been made yet
  UNMATCHED = "UNMATCHED",
  // Max attempts for associations was reached
  FAILED = "FAILED",
  // A weak association (requires human review) was made
  WEAK = "WEAK",
  // A strong association was made (manually set by a human, manually approved by a human, or automatically classified
  // as strong)
  STRONG = "STRONG",
}

// ^ convert to a function for AutoRenameAssociationStatus
/**
 * Converts an AutoRenameAssociationStatus to a string suitable for display in the UI. Will always return a lowercase,
 * so you may need to adjust capitalization depending on the context.
 * @param status
 */
export function autoRenameAssociationStatusToUiString(status: AutoRenameAssociationStatus) {
  const outputMap: Record<AutoRenameAssociationStatus, string> = {
    [AutoRenameAssociationStatus.UNMATCHED]: "unmatched",
    [AutoRenameAssociationStatus.FAILED]: "failed",
    [AutoRenameAssociationStatus.WEAK]: "weak",
    [AutoRenameAssociationStatus.STRONG]: "strong",
  };

  return outputMap[status];
}

export function isAutoRenameAssociationStatus(x: unknown): x is AutoRenameAssociationStatus {
  return Object.values(AutoRenameAssociationStatus).includes(x as AutoRenameAssociationStatus);
}
