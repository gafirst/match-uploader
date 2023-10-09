export type YouTubePlaylists = Record<string, YouTubePlaylist>;

export interface YouTubePlaylist {
    // The playlist ID
    id: string;
    // The cached name of the playlist
    name: string | null;
}
