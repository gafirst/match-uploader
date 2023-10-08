import { CompLevel } from "@src/models/CompLevel";
import MatchKey from "@src/models/MatchKey";

describe("MatchKey", () => {
    it("should parse a valid match key", () => {
        const matchkey = MatchKey.fromString("2023gadal_qm16");
        expect(matchkey.compLevel).toEqual(CompLevel.Qualification);
        expect(matchkey.eventCode).toEqual('gadal');
        expect(matchkey.matchNumber).toEqual(16);
        expect(matchkey.year).toEqual(2023);
    });
});
