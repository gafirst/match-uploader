/* globals describe expect expectAsync it */
import mockFs from "mock-fs";
import { type ISettings } from "@src/models/Settings";
import { readSettingsJson } from "@src/repos/JsonStorageRepo";

const sampleSettings: ISettings = {
  eventName: "Example Event",
  eventTbaCode: "2023gacmp",
  videoSearchDirectory: "./videos",
  googleAuthStatus: "",
  googleClientId: "",
};

describe("readSettingsJson", () => {
  it("should throw if settings file doesn't exist", async () => {
    mockFs({ settings: {} });
    const settings = readSettingsJson("houdini.json");
    await expectAsync(settings).toBeRejectedWithError();
    mockFs.restore();
  });

  it("should use template file when existing file is not found", async () => {
    mockFs({
      "settings/settings.example.json": JSON.stringify(sampleSettings),
    });

    await expectAsync(readSettingsJson("houdini.json")).toBeRejectedWithError();
    const settings = await readSettingsJson("houdini.json", "settings/settings.example.json");
    expect(settings).toEqual(sampleSettings);
    mockFs.restore();
  });

  it("should return active settings object when the file exists, even if a template file is also provided",
      async () => {
    mockFs({
      "settings/settings.example.json": JSON.stringify(sampleSettings),
      "settings/settings.json": JSON.stringify({
          ...sampleSettings,
          eventName: "Rosstravaganza 2023",
        }),
    });

    const settings = await readSettingsJson("settings/settings.json");
    expect(settings).toEqual({ ...sampleSettings, eventName: "Rosstravaganza 2023" });
    mockFs.restore();
  });
});
