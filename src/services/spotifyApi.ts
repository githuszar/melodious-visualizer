
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
  UserProfile
} from "@/types/spotify";
import { getAccessToken } from "./spotifyAuth";
import { saveGeneratedImage, generateLocalPythonData } from "./dataStorage";
import { saveImageToLocalFile } from "./imageGenerator";
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
 * Melhorado para obter dados em tempo real, com cache configurável
 */
export const getTopArtists = async (
  timeRange: TimeRange = "short_term", // Preferir short_term para dados mais recentes
  limit: number = 50, // Aumentado para mais dados
  forceRefresh: boolean = true // Forçar atualização por padrão
): Promise<TopItemsResponse<SpotifyArtist>> => {
  // Verificar se temos dados em cache e se podemos usá-los
  const cacheKey = `top_artists_${timeRange}_${limit}`;
  const cachedData = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(`${cacheKey}_time`);
  const now = Date.now();
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
  
  // Se temos dados em cache válidos e não estamos forçando atualização
  if (!forceRefresh && cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
    console.log("Usando dados em cache para top artists");
    return JSON.parse(cachedData);
  }
  
  // Caso contrário, buscar novos dados
  const data = await spotifyFetch<TopItemsResponse<SpotifyArtist>>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`
  );
  
  // Salvar em cache para uso futuro
  localStorage.setItem(cacheKey, JSON.stringify(data));
  localStorage.setItem(`${cacheKey}_time`, now.toString());
  
  return data;
};

/**
 * Get user's top tracks
 * Melhorado para obter dados em tempo real, com cache configurável
 */
export const getTopTracks = async (
  timeRange: TimeRange = "short_term", // Preferir short_term para dados mais recentes
  limit: number = 50, // Aumentado para mais dados
  forceRefresh: boolean = true // Forçar atualização por padrão
): Promise<TopItemsResponse<SpotifyTrack>> => {
  // Verificar se temos dados em cache e se podemos usá-los
  const cacheKey = `top_tracks_${timeRange}_${limit}`;
  const cachedData = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(`${cacheKey}_time`);
  const now = Date.now();
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
  
  // Se temos dados em cache válidos e não estamos forçando atualização
  if (!forceRefresh && cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
    console.log("Usando dados em cache para top tracks");
    return JSON.parse(cachedData);
  }
  
  // Caso contrário, buscar novos dados
  const data = await spotifyFetch<TopItemsResponse<SpotifyTrack>>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
  );
  
  // Salvar em cache para uso futuro
  localStorage.setItem(cacheKey, JSON.stringify(data));
  localStorage.setItem(`${cacheKey}_time`, now.toString());
  
  return data;
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
 * Melhorada para sempre buscar dados frescos e garantir unicidade de imagem
 */
export const getRealUserMusicData = async (forceRefresh: boolean = true): Promise<UserMusicData> => {
  try {
    // Obter timestamp de login único para garantir unicidade da imagem
    const loginTimestamp = Date.now();
    console.log(`Inicializando coleta de dados - Login ID: ${loginTimestamp}`);
    
    // Get user profile
    const user = await getCurrentUser();
    const userProfile = await getUserProfile();
    
    console.log("Obtendo dados em tempo real do Spotify para o usuário:", userProfile.name);
    
    // Get top artists and tracks - forçar termo curto para dados mais recentes
    const topArtistsResponse = await getTopArtists("short_term", 50, forceRefresh);
    const topTracksResponse = await getTopTracks("short_term", 50, forceRefresh);
    
    // Get user playlists - limite aumentado para mais dados
    const userPlaylistsResponse = await getUserPlaylists(20);
    
    console.log(`Obtidos: ${topArtistsResponse.items.length} artistas, ${topTracksResponse.items.length} músicas`);
    
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
    
    // Usar o loginTimestamp para garantir unicidade a cada login
    const timestamp = loginTimestamp;
    
    // Criar fatores de unicidade usando dados do perfil e números primos
    const uniquenessFactors = [
      avgEnergy * 17.31,
      avgValence * 19.47,
      avgDanceability * 23.89,
      avgAcousticness * 29.71,
      (avgTempos / 200) * 31.37,
      (user.id.charCodeAt(0) % 100) / 100 * 37.43,
      (timestamp % 10000) / 10000 * 41.59
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
    
    // Adicionar o timestamp atual para garantir uma seed diferente a cada login
    const seedWithTimestamp = highPrecisionSeed + timestamp;
    
    // Normalize to a stable range but keep high precision
    const normalizedSeed = Math.abs(Math.sin(seedWithTimestamp)) * 9999999999;
    
    console.log("Gerando perfil musical único com timestamp:", timestamp);
    console.log("Score único gerado:", uniqueScore);
    console.log("Seed única para imagem:", normalizedSeed);
    
    // Criar o objeto musicIndex
    const musicIndex = {
      energy: avgEnergy,
      valence: avgValence,
      danceability: avgDanceability,
      acousticness: avgAcousticness,
      topGenres,
      uniqueScore,
      colorPalette,
      // Add the high precision seed for image generation
      imageSeed: normalizedSeed
    };
    
    // Tentativa de salvar dados para o script Python
    try {
      // Tentar salvar a imagem localmente via localStorage temporário
      saveImageToLocalFile(musicIndex);
      
      // Tentativa de gerar arquivo temporário para o Python
      generateLocalPythonData({
        userId: user.id,
        userProfile,
        topArtists: [],
        topTracks: [],
        userPlaylists: [],
        topGenres,
        musicIndex,
        lastUpdated: new Date().toISOString()
      });
    } catch (localSaveError) {
      console.warn("Não foi possível salvar dados localmente:", localSaveError);
    }
    
    // Retornar os dados completos
    return {
      userId: user.id,
      userProfile,
      topArtists,
      topTracks,
      userPlaylists,
      topGenres,
      audioFeatures,
      musicIndex,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching real user data:", error);
    throw new Error("Failed to fetch data from Spotify API");
  }
};
