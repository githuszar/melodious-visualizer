
export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyUser {
  display_name: string;
  id: string;
  images: { url: string }[];
  followers: { total: number };
  country: string;
  product: string;
  external_urls: { spotify: string };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string; height: number; width: number }[];
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
    release_date: string;
  };
  popularity: number;
  external_urls: { spotify: string };
}

export interface TopItemsResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  previous: string | null;
  next: string | null;
}

export interface AudioFeatures {
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
}

export interface MusicIndex {
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  topGenres: string[];
  uniqueScore: number;
  colorPalette: string[];
}

export interface UserMusicData {
  userId: string;
  topArtists: SpotifyArtist[];
  topTracks: SpotifyTrack[];
  topGenres: string[];
  audioFeatures: AudioFeatures[];
  musicIndex: MusicIndex;
  lastUpdated: string;
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';
