import MatchKey from "@src/models/MatchKey";
import { PlayoffsType } from "@src/models/PlayoffsType";
import { Match } from "@src/models/Match";

describe("Match", () => {
  it("should correctly compare qualification matches", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_qm16", PlayoffsType.DoubleElimination);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_qm17", PlayoffsType.DoubleElimination);
    const match2 = new Match(matchKey2);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match2.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match1)).toBe(false);
  });

  it("should correct compare double elimination playoff matches", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_sf1m1", PlayoffsType.DoubleElimination);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_sf2m1", PlayoffsType.DoubleElimination);
    const match2 = new Match(matchKey2);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match2.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match1)).toBe(false);
  });

  it("should correctly compare finals matches", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_f1m1", PlayoffsType.DoubleElimination);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_f1m2", PlayoffsType.DoubleElimination);
    const match2 = new Match(matchKey2);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match2.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match1)).toBe(false);
  });

  it("should correctly compare Best of 3 quarterfinals matches in the same set", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_qf1m1", PlayoffsType.BestOf3);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_qf1m2", PlayoffsType.BestOf3);
    const match2 = new Match(matchKey2);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match2.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match1)).toBe(false);
  });

  it("should correctly compare Best of 3 quarterfinals matches in different sets", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_qf1m2", PlayoffsType.BestOf3);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_qf2m3", PlayoffsType.BestOf3);
    const match2 = new Match(matchKey2);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match2.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match1)).toBe(false);
  });

  it("should correctly compare Best of 3 semifinals matches in different sets", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_sf2m2", PlayoffsType.BestOf3);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_sf4m2", PlayoffsType.BestOf3);
    const match2 = new Match(matchKey2);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match2.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match1)).toBe(false);
  });

  it("should correctly compare Best of 3 semifinals matches in different sets", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_sf2m2", PlayoffsType.BestOf3);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_sf4m2", PlayoffsType.BestOf3);
    const match2 = new Match(matchKey2);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match2.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match1)).toBe(false);
  });

  it("should correctly compare Best of 3 finals matches", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_f1m2", PlayoffsType.BestOf3);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_f1m3", PlayoffsType.BestOf3);
    const match2 = new Match(matchKey2);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match2.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match1)).toBe(false);
  });

  it("should correctly compare Best of 3 playoff matches between rounds", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_qf1m3", PlayoffsType.BestOf3);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_sf1m2", PlayoffsType.BestOf3);
    const match2 = new Match(matchKey2);

    const matchKey3 = MatchKey.fromString("2023gadal_f1m1", PlayoffsType.BestOf3);
    const match3 = new Match(matchKey3);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match3.isAfter(match2)).toBe(true);
    expect(match3.isAfter(match1)).toBe(true);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match3)).toBe(false);
    expect(match2.isAfter(match3)).toBe(false);
  });

  it("should correctly compare Double Elimination playoff matches between rounds", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_sf3m1", PlayoffsType.DoubleElimination);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_sf5m1", PlayoffsType.DoubleElimination);
    const match2 = new Match(matchKey2);

    const matchKey3 = MatchKey.fromString("2023gadal_f1m2", PlayoffsType.DoubleElimination);
    const match3 = new Match(matchKey3);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match3.isAfter(match2)).toBe(true);
    expect(match3.isAfter(match1)).toBe(true);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match3)).toBe(false);
    expect(match2.isAfter(match3)).toBe(false);
  });

  it("should correctly compare Double Elimination playoff matches (non-finals)", () => {
    const matchKey1 = MatchKey.fromString("2023gadal_sf1m1", PlayoffsType.DoubleElimination);
    const match1 = new Match(matchKey1);

    const matchKey2 = MatchKey.fromString("2023gadal_sf2m1", PlayoffsType.DoubleElimination);
    const match2 = new Match(matchKey2);

    const matchKey3 = MatchKey.fromString("2023gadal_sf5m1", PlayoffsType.DoubleElimination);
    const match3 = new Match(matchKey3);

    expect(match2.isAfter(match1)).toBe(true);
    expect(match3.isAfter(match2)).toBe(true);
    expect(match3.isAfter(match1)).toBe(true);
    expect(match1.isAfter(match2)).toBe(false);
    expect(match1.isAfter(match3)).toBe(false);
    expect(match2.isAfter(match3)).toBe(false);
  });
});
