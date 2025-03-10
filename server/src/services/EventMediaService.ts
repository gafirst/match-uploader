import { getFilesMatchingPattern } from "@src/repos/FileStorageRepo";
import { getDescriptionTemplate, getSettings } from "@src/services/SettingsService";
import { VideoInfo } from "@src/models/VideoInfo";
import { VideoType } from "@src/models/VideoType";
import { capitalizeFirstLetter } from "@src/util/string";
import { matchUploaderAttribution } from "@src/util/videoDescription";
import Mustache from "mustache";

export async function getEventMediaVideoFiles(): Promise<string[]> {
  const { videoSearchDirectory } = await getSettings();

  const filePaths = await getFilesMatchingPattern(videoSearchDirectory, `**/*`, 2, false);

  return filePaths.filter(path => {
    const pathEnd: string = (path.split("/").at(-1)?.toLowerCase() ?? "");
    return path.includes("/") && !pathEnd.includes("qualification") && !pathEnd.includes("playoff");
  }).sort();
}

export async function getEventMediaVideos(filePaths: string[], mediaTitle: string): Promise<VideoInfo[]> {
  const { eventName } = await getSettings();

  return filePaths.filter(file => file.includes("/"))
    .map(path => {
      const videoLabel = VideoInfo.getVideoLabelFromPath(path);
      let videoTitle = `${mediaTitle} - ${eventName}`;

      if (videoLabel) {
        videoTitle = `${mediaTitle} - ${capitalizeFirstLetter(videoLabel)} - ${eventName}`;
      }

      return new VideoInfo(
        path,
        videoLabel,
        videoTitle,
        false,
        VideoType.EventMedia,
      );
    });
}

async function generateEventMediaDetailsUrl(): Promise<{
  url: string,
  site: "The Blue Alliance" | "FRC Events",
}> {
  const { eventTbaCode, useFrcEventsApi } = await getSettings();
  const year = eventTbaCode.substring(0, 4);
  const eventCode = eventTbaCode.substring(4);

  if (useFrcEventsApi) {
    return {
      url: `https://frc-events.firstinspires.org/${year}/${eventCode}`,
      site: "FRC Events",
    };
  }

  return {
    url: `https://thebluealliance.com/event/${eventTbaCode}`,
    site: "The Blue Alliance",
  };
}


export async function generateEventMediaVideoDescription(mediaTitle: string, eventName: string): Promise<string> {
  const templateString = await getDescriptionTemplate();

  const { site: eventDetailsSite, url: detailsUrl } = await generateEventMediaDetailsUrl();

  const view = {
    isMatch: false,
    eventName,
    mediaTitle,
    eventDetailsSite,
    detailsUrl,
    matchUploaderAttribution,
  };

  return Mustache.render(templateString, view);
}
