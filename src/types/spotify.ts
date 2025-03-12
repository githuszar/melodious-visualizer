
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
  email?: string;
  images: { url: string }[];
  followers: { total: number };
  country: string;
  product: string;
  external_urls: { spotify: string };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
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

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string; height: number; width: number }[];
  owner: {
    id: string;
    display_name: string;
  };
  tracks: {
    total: number;
  };
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

export interface AvailableGenres {
  genres: string[];
}

export interface MusicIndex {
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  topGenres: string[];
  uniqueScore: number;
  colorPalette: string[];
  imageSeed?: number; // Para geração de imagem de alta precisão
}

export interface UserMusicData {
  userId: string;
  userProfile?: UserProfile;
  topArtists: SpotifyArtist[];
  topTracks: SpotifyTrack[];
  userPlaylists?: SpotifyPlaylist[];
  topGenres: string[];
  audioFeatures: AudioFeatures[];
  musicIndex: MusicIndex;
  lastUpdated: string;
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

// Interface para o formato de armazenamento do usuário
export interface UserRecord {
  id: string;
  name: string;
  timestamp: string;
  top_artist: string;
  top_genre: string;
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  music_score: number;
  image_path?: string;
  high_precision_seed?: number;
}

// Interface para o banco de dados de usuários
export interface UserDatabase {
  users: UserRecord[];
}
