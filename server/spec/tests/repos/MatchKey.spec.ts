import { CompLevel } from "@src/models/CompLevel";
import MatchKey from "@src/models/MatchKey";
import { PlayoffsType } from "@src/models/PlayoffsType";

describe("MatchKey", () => {
    it("should parse a valid qualification match key", () => {
        const matchkey = MatchKey.fromString("2023gadal_qm16", PlayoffsType.DoubleElimination);
        expect(matchkey.compLevel).toEqual(CompLevel.Qualification);
        expect(matchkey.eventCode).toEqual("gadal");
        expect(matchkey.matchNumber).toEqual(16);
        expect(matchkey.setNumber).toBeNull();
        expect(matchkey.year).toEqual(2023);
    });

    it("should parse valid double elimination playoff match keys", () => {
        const sf1m1 = MatchKey.fromString("2023gadal_sf1m1", PlayoffsType.DoubleElimination);
        expect(sf1m1.compLevel).toEqual(CompLevel.Semifinal);
        expect(sf1m1.eventCode).toEqual("gadal");
        expect(sf1m1.matchNumber).toEqual(1);
        expect(sf1m1.setNumber).toEqual(1);
        expect(sf1m1.year).toEqual(2023);

        const sf2m1 = MatchKey.fromString("2023gadal_sf2m1", PlayoffsType.DoubleElimination);
        expect(sf2m1.compLevel).toEqual(CompLevel.Semifinal);
        expect(sf2m1.eventCode).toEqual("gadal");
        expect(sf2m1.matchNumber).toEqual(1);
        expect(sf2m1.setNumber).toEqual(2);
        expect(sf2m1.year).toEqual(2023);

        const f1m1 = MatchKey.fromString("2023gadal_f1m1", PlayoffsType.DoubleElimination);
        expect(f1m1.compLevel).toEqual(CompLevel.Final);
        expect(f1m1.eventCode).toEqual("gadal");
        expect(f1m1.matchNumber).toEqual(1);
        expect(f1m1.setNumber).toEqual(1);
        expect(f1m1.year).toEqual(2023);

        const f1m2 = MatchKey.fromString("2023gadal_f1m2", PlayoffsType.DoubleElimination);
        expect(f1m2.compLevel).toEqual(CompLevel.Final);
        expect(f1m2.eventCode).toEqual("gadal");
        expect(f1m2.matchNumber).toEqual(2);
        expect(f1m2.setNumber).toEqual(1);
        expect(f1m2.year).toEqual(2023);

        const f1m3 = MatchKey.fromString("2023gadal_f1m3", PlayoffsType.DoubleElimination);
        expect(f1m3.compLevel).toEqual(CompLevel.Final);
        expect(f1m3.eventCode).toEqual("gadal");
        expect(f1m3.matchNumber).toEqual(3);
        expect(f1m3.setNumber).toEqual(1);
        expect(f1m3.year).toEqual(2023);
    });
});
