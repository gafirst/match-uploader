/**
 * Express router paths
 */

import { Immutable } from '@src/util/Immutable';


const Paths = {
  Base: '/api/v1',
  Settings: {
    Base: '/settings', // Note that base paths *must* start with a /
    List: '/',
    Update: '/:name',
  },
};

export type TPaths = Immutable<typeof Paths>;
export default Paths as TPaths;
