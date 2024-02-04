/**
 * Express router paths
 */

import { type Immutable } from "@src/util/Immutable";

// Start all paths with a /, even if empty
const Paths = {
  Base: "/api/v1",
  Settings: {
    Base: "/settings",
    List: "/",
    ListSecrets: "/secrets",
    Update: "/:name",
    DescriptionTemplate: "/description",
  },
  Matches: {
    Base: "/matches",
    List: "/",
    Get: "/:matchKey",
    RecommendVideoFiles: "/:matchKey/videos/recommend",
    GenerateDescription: "/:matchKey/description",
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
  },
};

export type TPaths = Immutable<typeof Paths>;
export default Paths as TPaths;
