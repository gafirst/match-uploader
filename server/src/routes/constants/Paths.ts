/**
 * Express router paths
 */

import { type Immutable } from '@src/util/Immutable';


// Start all paths with a /, even if empty
const Paths = {
  Base: '/api/v1',
  Settings: {
    Base: '/settings',
    List: '/',
    Update: '/:name',
  },
  YouTube: {
    Base: '/youtube',
    AuthStart: '/auth',
    AuthStatus: '/auth/status',
    AuthCallback: '/auth/callback',
    AuthReset: '/auth/reset',
    AuthRedirectUri: '/auth/meta/redirectUri',
  },
};

export type TPaths = Immutable<typeof Paths>;
export default Paths as TPaths;
