// Test getLocalVideoFilesForMatch function, using mockFs
import { getLocalVideoFilesForMatch } from "@src/services/MatchesService";
import MatchKey from "@src/models/MatchKey";
import { PlayoffsType } from "@src/models/PlayoffsType";
import mockFs from "mock-fs";
import { sampleSettings } from "../util";

const sampleVideos = {
    "Qualification 1.mp4": "",
    "Qualification 2.mp4": "",
    "Qualification 10.mp4": "",
    "Playoff 1.mp4": "",
    "Playoff 2.mp4": "",
    "Playoff 10.mp4": "",
};

describe("MatchesService", () => {
    it("should return an empty array if no files are found", async () => {
        mockFs({
            videos: sampleVideos,
            "settings/settings.example.json": JSON.stringify(sampleSettings),
        });

        const files = await getLocalVideoFilesForMatch(
            MatchKey.fromString("2023gadal_qm16", PlayoffsType.DoubleElimination),
        );
        expect(files).toEqual([]);
        mockFs.restore();
    });
});
