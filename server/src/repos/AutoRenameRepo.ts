import type MatchKey from "@src/models/MatchKey";
import { Match } from "@src/models/Match";

export function getNewFileNamePreservingExtension(
  fileNameWithExtension: string,
  newFileNameWithoutExtension: string,
): string {
  const oldExtension = fileNameWithExtension.split(".").pop();
  return `${newFileNameWithoutExtension}.${oldExtension}`;
}

export function getNewFileNameForAutoRename(matchKey: MatchKey, isReplay: boolean): string {
    const match = new Match(matchKey, isReplay);
    return match.videoFileMatchingName;
}
