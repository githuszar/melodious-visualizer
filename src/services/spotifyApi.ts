
import { 
  SpotifyUser, 
  SpotifyArtist, 
  SpotifyTrack, 
  TopItemsResponse, 
  AudioFeatures,
  TimeRange
} from "@/types/spotify";
import { getAccessToken } from "./spotifyAuth";

const BASE_URL = "https://api.spotify.com/v1";

/**
 * Make authenticated request to Spotify API
 */
const spotifyFetch = async <T>(endpoint: string, options = {}): Promise<T> => {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error("No access token available");
  }
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "API request failed");
  }
  
  return response.json();
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<SpotifyUser> => {
  return spotifyFetch<SpotifyUser>("/me");
};

/**
 * Get user's top artists
 */
export const getTopArtists = async (
  timeRange: TimeRange = "medium_term",
  limit: number = 20
): Promise<TopItemsResponse<SpotifyArtist>> => {
  return spotifyFetch<TopItemsResponse<SpotifyArtist>>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`
  );
};

/**
 * Get user's top tracks
 */
export const getTopTracks = async (
  timeRange: TimeRange = "medium_term",
  limit: number = 20
): Promise<TopItemsResponse<SpotifyTrack>> => {
  return spotifyFetch<TopItemsResponse<SpotifyTrack>>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
  );
};

/**
 * Get audio features for multiple tracks
 */
export const getAudioFeatures = async (
  trackIds: string[]
): Promise<{ audio_features: AudioFeatures[] }> => {
  if (trackIds.length === 0) {
    return { audio_features: [] };
  }
  
  return spotifyFetch<{ audio_features: AudioFeatures[] }>(
    `/audio-features?ids=${trackIds.join(",")}`
  );
};

/**
 * Calculate the most common genres from user's top artists
 */
export const extractTopGenres = (artists: SpotifyArtist[]): string[] => {
  const genreCounts: Record<string, number> = {};
  
  artists.forEach(artist => {
    artist.genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });
  
  // Sort genres by count and return top ones
  return Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);
};

/**
 * Mock function to simulate data retrieval since we cannot actually make Spotify API calls
 * In a real app, this would be removed and the actual API functions above would be used
 */
export const getMockUserMusicData = async () => {
  // Mock top artists
  const mockTopArtists: SpotifyArtist[] = [
    {
      id: "4tZwfgrHOc3mvqYlEYSvVi",
      name: "Daft Punk",
      genres: ["electronic", "french house", "disco"],
      popularity: 82,
      images: [{ url: "https://i.scdn.co/image/ab6761610000e5eb2183ea958d3777b6ecb878c7", height: 640, width: 640 }],
      external_urls: { spotify: "https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi" }
    },
    {
      id: "53XhwfbYqKCa1cC15pYq2q",
      name: "Imagine Dragons",
      genres: ["modern rock", "pop rock"],
      popularity: 89,
      images: [{ url: "https://i.scdn.co/image/ab6761610000e5eb920dc1f617550de8388f368e", height: 640, width: 640 }],
      external_urls: { spotify: "https://open.spotify.com/artist/53XhwfbYqKCa1cC15pYq2q" }
    },
    {
      id: "6qqNVTkY8uBg9cP3Jd7DAH",
      name: "Billie Eilish",
      genres: ["pop", "electropop"],
      popularity: 91,
      images: [{ url: "https://i.scdn.co/image/ab6761610000e5eb7e487ded477e2bdc419ce781", height: 640, width: 640 }],
      external_urls: { spotify: "https://open.spotify.com/artist/6qqNVTkY8uBg9cP3Jd7DAH" }
    }
  ];
  
  // Mock top tracks
  const mockTopTracks: SpotifyTrack[] = [
    {
      id: "3Iyq9p8UFGJIHULFELtR1g",
      name: "Starboy",
      popularity: 85,
      artists: [{
        id: "1Xyo4u8uXC1ZmMpatF05PJ",
        name: "The Weeknd",
        genres: ["canadian contemporary r&b", "canadian pop"],
        popularity: 92,
        images: [{ url: "https://i.scdn.co/image/ab6761610000e5ebade0097de5dcdb2c3ad0b5d1", height: 640, width: 640 }],
        external_urls: { spotify: "https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ" }
      }],
      album: {
        id: "4AdZV63ycxFLF6Hcol0QnB",
        name: "Starboy",
        images: [{ url: "https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a", height: 640, width: 640 }],
        release_date: "2016-11-25"
      },
      external_urls: { spotify: "https://open.spotify.com/track/3Iyq9p8UFGJIHULFELtR1g" }
    },
    {
      id: "6DCZcSspjsKoFjzjrWoCdn",
      name: "God's Plan",
      popularity: 83,
      artists: [{
        id: "3TVXtAsR1Inumwj472S9r4",
        name: "Drake",
        genres: ["canadian hip hop", "canadian pop", "hip hop", "rap", "toronto rap"],
        popularity: 96,
        images: [{ url: "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9", height: 640, width: 640 }],
        external_urls: { spotify: "https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4" }
      }],
      album: {
        id: "1ATL5GLyefJaxhQzSPVrLX",
        name: "Scorpion",
        images: [{ url: "https://i.scdn.co/image/ab67616d0000b2733e0698e4ae5808b16201e181", height: 640, width: 640 }],
        release_date: "2018-06-29"
      },
      external_urls: { spotify: "https://open.spotify.com/track/6DCZcSspjsKoFjzjrWoCdn" }
    }
  ];
  
  // Mock audio features
  const mockAudioFeatures: AudioFeatures[] = [
    {
      danceability: 0.795,
      energy: 0.629,
      key: 7,
      loudness: -5.817,
      mode: 1,
      speechiness: 0.04,
      acousticness: 0.017,
      instrumentalness: 0.000645,
      liveness: 0.139,
      valence: 0.428,
      tempo: 130.048
    },
    {
      danceability: 0.754,
      energy: 0.449,
      key: 5,
      loudness: -9.211,
      mode: 0,
      speechiness: 0.225,
      acousticness: 0.0173,
      instrumentalness: 0.0,
      liveness: 0.121,
      valence: 0.602,
      tempo: 77.169
    }
  ];
  
  // Extract top genres from mock artists
  const topGenres = extractTopGenres(mockTopArtists);
  
  // Calculate music index based on audio features
  const avgEnergy = mockAudioFeatures.reduce((sum, feat) => sum + feat.energy, 0) / mockAudioFeatures.length;
  const avgValence = mockAudioFeatures.reduce((sum, feat) => sum + feat.valence, 0) / mockAudioFeatures.length;
  const avgDanceability = mockAudioFeatures.reduce((sum, feat) => sum + feat.danceability, 0) / mockAudioFeatures.length;
  const avgAcousticness = mockAudioFeatures.reduce((sum, feat) => sum + feat.acousticness, 0) / mockAudioFeatures.length;
  
  // Generate color palette based on audio features
  const colorPalette = [
    `hsl(${Math.floor(360 * avgValence)}, 70%, 60%)`,
    `hsl(${Math.floor(200 * avgEnergy)}, 80%, 50%)`,
    `hsl(${Math.floor(100 * avgDanceability)}, 60%, 45%)`,
    `hsl(${Math.floor(290 * avgAcousticness)}, 50%, 40%)`
  ];
  
  // Calculate a unique score as a demo of an index
  const uniqueScore = Math.floor(
    (avgEnergy * 25) + 
    (avgValence * 25) + 
    (avgDanceability * 25) + 
    (avgAcousticness * 25)
  );
  
  return {
    userId: "mock_user_1",
    topArtists: mockTopArtists,
    topTracks: mockTopTracks,
    topGenres,
    audioFeatures: mockAudioFeatures,
    musicIndex: {
      energy: avgEnergy,
      valence: avgValence,
      danceability: avgDanceability,
      acousticness: avgAcousticness,
      topGenres,
      uniqueScore,
      colorPalette
    },
    lastUpdated: new Date().toISOString()
  };
};
