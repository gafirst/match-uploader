import { TheBlueAllianceTrustedRepo } from "@src/repos/TheBlueAllianceTrustedRepo";

describe("TBA request signature", () => {
    it("should be correct for a sample request", () => {
        // This tests the signature for the sample request listed on https://www.thebluealliance.com/apidocs/trusted/v1
        // These API credentials are NOT real.

        const fakeAuthId = "rosssssssssss";
        const fakeAuthSecret =
            "ExqeZK3Gbo9v95YnqmsiADzESo9HNgyhIOYSMyRpqJqYv13EazNRaDIPPJuOXrQp"; // This is NOT a real secret!
        const tbaTrustedRepo = new TheBlueAllianceTrustedRepo(fakeAuthId, fakeAuthSecret);

        const path = "/api/trusted/v1/event/2014casj/matches/delete";
        const body = JSON.stringify(["qm1"]);

        expect(tbaTrustedRepo.generateRequestSignature(path, body)).toBe("ca5c3e5c1b0e7132e4af13f805eca0be");
    });
});
