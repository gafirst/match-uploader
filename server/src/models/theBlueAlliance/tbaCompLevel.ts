import { CompLevel } from "@src/models/CompLevel";

export type TbaCompLevel = "qm" | "qf" | "sf" | "f" | "unknown";

export function toCompLevel(tbaCompLevel: TbaCompLevel): CompLevel {
    switch (tbaCompLevel) {
        case "qm":
            return CompLevel.Qualification;
        case "qf":
            return CompLevel.Quarterfinal;
        case "sf":
            return CompLevel.Semifinal;
        case "f":
            return CompLevel.Final;
        default:
            throw new Error(`tbaCompLevel ${tbaCompLevel} is invalid`);
    }
}
