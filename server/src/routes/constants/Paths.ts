/**
 * Express router paths
 */

import {type Immutable} from "@src/util/Immutable";

// Start all paths with a /, even if empty
const Paths = {
  Base: "/api/v1",
  Settings: {
    Base: "/settings",
    List: "/",
    ListSecrets: "/secrets",
    Update: "/:name",
  },
  Matches: {
    Base: "/matches",
    List: "/",
    Get: "/:matchKey",
    RecommendVideoFiles: "/:matchKey/videos/recommend",
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
  },
};

export type TPaths = Immutable<typeof Paths>;
export default Paths as TPaths;
