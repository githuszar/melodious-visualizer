import { 
  SpotifyUser, 
  SpotifyArtist, 
  SpotifyTrack, 
  TopItemsResponse, 
  AudioFeatures,
  TimeRange,
  UserMusicData,
  SpotifyPlaylist,
  AvailableGenres,
  UserProfile,
  MusicIndex
} from "@/types/spotify";
import { getAccessToken } from "./spotifyAuth";
import axios from "axios";

const BASE_URL = "https://api.spotify.com/v1";

/**
 * Make authenticated request to Spotify API
 */
const spotifyFetch = async <T>(endpoint: string, options = {}): Promise<T> => {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error("No access token available");
  }
  
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      ...options
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<SpotifyUser> => {
  return spotifyFetch<SpotifyUser>("/me");
};

/**
 * Get user profile with name, email and image
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  const userData = await spotifyFetch<SpotifyUser>("/me");
  
  return {
    id: userData.id,
    name: userData.display_name,
    email: userData.email || "Email not available",
    image: userData.images && userData.images.length > 0 ? userData.images[0].url : null
  };
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
 * Get user's playlists
 */
export const getUserPlaylists = async (limit: number = 20): Promise<TopItemsResponse<SpotifyPlaylist>> => {
  return spotifyFetch<TopItemsResponse<SpotifyPlaylist>>(
    `/me/playlists?limit=${limit}`
  );
};

/**
 * Get user's saved tracks
 */
export const getUserSavedTracks = async (limit: number = 20): Promise<TopItemsResponse<{track: SpotifyTrack}>> => {
  return spotifyFetch<TopItemsResponse<{track: SpotifyTrack}>>(
    `/me/tracks?limit=${limit}`
  );
};

/**
 * Get available genres for recommendations
 */
export const getAvailableGenres = async (): Promise<AvailableGenres> => {
  return spotifyFetch<AvailableGenres>(
    `/recommendations/available-genre-seeds`
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
 * Get real user music data from Spotify API
 */
export const getRealUserMusicData = async (): Promise<UserMusicData> => {
  try {
    // Get user profile
    const user = await getCurrentUser();
    const userProfile = await getUserProfile();
    
    // Get top artists and tracks
    const topArtistsResponse = await getTopArtists("medium_term", 50);
    const topTracksResponse = await getTopTracks("medium_term", 50);
    
    // Get user playlists
    const userPlaylistsResponse = await getUserPlaylists(10);
    
    const topArtists = topArtistsResponse.items;
    const topTracks = topTracksResponse.items;
    const userPlaylists = userPlaylistsResponse.items;
    
    // Extract track IDs for audio features
    const trackIds = topTracks.slice(0, 50).map(track => track.id);
    
    // Get audio features for tracks
    const audioFeaturesResponse = await getAudioFeatures(trackIds);
    const audioFeatures = audioFeaturesResponse.audio_features.filter(Boolean);
    
    // Extract top genres
    const topGenres = extractTopGenres(topArtists);
    
    // Calculate music index based on audio features with improved precision
    const avgEnergy = audioFeatures.reduce((sum, feat) => sum + feat.energy, 0) / audioFeatures.length || 0.5;
    const avgValence = audioFeatures.reduce((sum, feat) => sum + feat.valence, 0) / audioFeatures.length || 0.5;
    const avgDanceability = audioFeatures.reduce((sum, feat) => sum + feat.danceability, 0) / audioFeatures.length || 0.5;
    const avgAcousticness = audioFeatures.reduce((sum, feat) => sum + feat.acousticness, 0) / audioFeatures.length || 0.3;
    const avgTempos = audioFeatures.reduce((sum, feat) => sum + feat.tempo, 0) / audioFeatures.length || 120;
    
    // Generate color palette based on audio features with higher precision and visual aesthetics
    const colorPalette = [
      // Energy color (red to blue spectrum)
      `hsl(${Math.floor(240 - (avgEnergy * 240))}, 80%, ${Math.floor(40 + avgValence * 30)}%)`,
      // Valence color (yellow to purple spectrum)
      `hsl(${Math.floor(60 + (160 * (1 - avgValence)))}, 80%, ${Math.floor(45 + avgEnergy * 25)}%)`,
      // Dance color (green to pink spectrum)
      `hsl(${Math.floor(120 + (300 * avgDanceability) % 360)}, 70%, ${Math.floor(50 + avgValence * 20)}%)`,
      // Acousticness color (brown to cyan spectrum)
      `hsl(${Math.floor(30 + (150 * avgAcousticness))}, ${Math.floor(60 + avgEnergy * 30)}%, ${Math.floor(40 + avgValence * 30)}%)`
    ];
    
    // Create a much more unique score with high precision
    // Using multiple features and prime numbers to increase uniqueness
    const uniquenessFactors = [
      avgEnergy * 17.31,
      avgValence * 19.47,
      avgDanceability * 23.89,
      avgAcousticness * 29.71,
      (avgTempos / 200) * 31.37,
      (user.id.charCodeAt(0) % 100) / 100 * 37.43,
      (Date.now() % 10000) / 10000 * 41.59
    ];
    
    // Create a high-precision unique score (0-100)
    const uniqueScore = Math.floor(
      uniquenessFactors.reduce((acc, factor) => (acc + factor) % 100, 0)
    );
    
    // Use more data points for unique image generation
    const highPrecisionSeed = topArtists.slice(0, 5).reduce((seed, artist, index) => {
      return seed + (artist.popularity * Math.PI * (index + 1)) + 
             (artist.name.charCodeAt(0) * Math.E);
    }, 0) + topTracks.slice(0, 5).reduce((seed, track, index) => {
      return seed + (track.popularity * Math.sqrt(2) * (index + 1)) + 
             (track.name.charCodeAt(0) * Math.log(10));
    }, 0);
    
    // Normalize to a stable range but keep high precision
    const normalizedSeed = Math.abs(Math.sin(highPrecisionSeed)) * 9999999999;
    
    return {
      userId: user.id,
      userProfile,
      topArtists,
      topTracks,
      userPlaylists,
      topGenres,
      audioFeatures,
      musicIndex: {
        energy: avgEnergy,
        valence: avgValence,
        danceability: avgDanceability,
        acousticness: avgAcousticness,
        topGenres,
        uniqueScore,
        colorPalette,
        // Add the high precision seed for image generation
        imageSeed: normalizedSeed
      },
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching real user data:", error);
    // Fallback to mock data if API fails
    return getMockUserMusicData();
  }
};

/**
 * Mock function to simulate data retrieval for development/testing
 */
export const getMockUserMusicData = async () => {
  // Mock user profile
  const mockUserProfile: UserProfile = {
    id: "mock_user_1",
    name: "Demo User",
    email: "demo@example.com",
    image: "https://i.scdn.co/image/ab6775700000ee85c05e2c33c8fb44e4728350dc"
  };
  
  // Mock playlists
  const mockPlaylists: SpotifyPlaylist[] = [
    {
      id: "37i9dQZF1DXcBWIGoYBM5M",
      name: "Today's Top Hits",
      description: "Spotify's top 50 global chart",
      images: [{ url: "https://i.scdn.co/image/ab67706f0000e5eb2183ea958d3777b6ecb878c7", height: 300, width: 300 }],
      owner: {
        id: "spotify",
        display_name: "Spotify"
      },
      tracks: {
        total: 50
      }
    },
    {
      id: "37i9dQZF1DWXRqgorJj26U",
      name: "Rock Classics",
      description: "Classic rock songs from the 60s to the 90s",
      images: [{ url: "https://i.scdn.co/image/ab67706f0000e5ebe8e28219724c2423afa4d320", height: 300, width: 300 }],
      owner: {
        id: "spotify",
        display_name: "Spotify"
      },
      tracks: {
        total: 100
      }
    }
  ];

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
      instrumentalness: 0,
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
  
  // Generate improved color palette based on audio features
  const colorPalette = [
    // Energy color (red to blue spectrum)
    `hsl(${Math.floor(240 - (avgEnergy * 240))}, 80%, ${Math.floor(40 + avgValence * 30)}%)`,
    // Valence color (yellow to purple spectrum)
    `hsl(${Math.floor(60 + (160 * (1 - avgValence)))}, 80%, ${Math.floor(45 + avgEnergy * 25)}%)`,
    // Dance color (green to pink spectrum)
    `hsl(${Math.floor(120 + (300 * avgDanceability) % 360)}, 70%, ${Math.floor(50 + avgValence * 20)}%)`,
    // Acousticness color (brown to cyan spectrum)
    `hsl(${Math.floor(30 + (150 * avgAcousticness))}, ${Math.floor(60 + avgEnergy * 30)}%, ${Math.floor(40 + avgValence * 30)}%)`
  ];
  
  // Calculate a unique score as a demo of an index
  const uniqueScore = Math.floor(
    (avgEnergy * 25) + 
    (avgValence * 25) + 
    (avgDanceability * 25) + 
    (avgAcousticness * 25)
  );
  
  // Add a unique high-precision seed for mock data
  const mockSeed = Math.abs(Math.sin(Date.now() * Math.PI)) * 9999999999;
  
  const mockData = {
    userId: "mock_user_1",
    userProfile: mockUserProfile,
    topArtists: mockTopArtists,
    topTracks: mockTopTracks,
    userPlaylists: mockPlaylists,
    topGenres,
    audioFeatures: mockAudioFeatures,
    musicIndex: {
      energy: avgEnergy,
      valence: avgValence,
      danceability: avgDanceability,
      acousticness: avgAcousticness,
      topGenres,
      uniqueScore,
      colorPalette,
      // Add the high precision seed for image generation
      imageSeed: mockSeed
    },
    lastUpdated: new Date().toISOString()
  };
  
  return mockData;
};
