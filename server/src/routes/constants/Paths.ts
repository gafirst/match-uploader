/**
 * Express router paths
 */

import { type Immutable } from "@src/util/Immutable";

// Start all paths with a /, even if empty
const Paths = {
  Base: "/api/v1",
  Settings: {
    Base: "/settings",
    List: "/values",
    ListSecrets: "/secrets",
    Update: "/values/:name",
    DescriptionTemplate: "/descriptionTemplate",
  },
  Matches: {
    Base: "/matches",
    List: "/",
    Get: "/:matchKey",
    RecommendVideoFiles: "/:matchKey/videos/recommend",
    GenerateDescription: "/:matchKey/description",
    PossibleNextMatches: "/:matchKey/nextMatch",
    UploadStatuses: "/uploaded",
  },
  EventMedia: {
    Base: "/event-media",
    RecommendVideoFiles: "/videos/recommend",
    GenerateDescription: "/videos/description",
    GetVideoMetadata: "/videos/metadata",
  },
  YouTube: {
    Base: "/youtube",
    Auth: {
      Base: "/auth",
      Start: "/",
      Status: "/status",
      Callback: "/callback",
      Reset: "/reset",
      RedirectUri: "/meta/redirectUri",
    },
    Status: "/status",
    Upload: "/upload",
    Playlists: "/playlists",
    SavePlaylistMapping: "/playlistMapping/:videoLabel",
  },
  Worker: {
    Base: "/worker",
    Jobs: {
      Base: "/jobs",
      List: "/",
      Stats: "/stats",
      Cancel: "/cancel",
    },
    ForceUnlockWorker: "/forceUnlock",
    Debug: {
      Base: "/debug",
      AutoRename: "/autoRename",
    },
  },
  AutoRename: {
    Base: "/autoRename",
    Associations: {
      Base: "/associations",
      Confirm: "/confirm",
      Ignore: "/ignore",
      UndoRename: "/undoRename",
      List: "/",
    },
  },
};

export type TPaths = Immutable<typeof Paths>;
export default Paths as TPaths;
