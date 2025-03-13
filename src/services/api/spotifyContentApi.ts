import { TimeRange, TopItemsResponse, SpotifyArtist, SpotifyTrack, AudioFeatures, AvailableGenres } from "@/types/spotify";
import { spotifyFetch } from "./spotifyBaseApi";

/**
 * Get user's top artists
 * Modified to always get real-time data with configurable cache
 */
export const getTopArtists = async (
  timeRange: TimeRange = "short_term",
  limit: number = 50,
  forceRefresh: boolean = true
): Promise<TopItemsResponse<SpotifyArtist>> => {
  // Check if we have cached data and can use it
  const cacheKey = `top_artists_${timeRange}_${limit}`;
  const cachedData = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(`${cacheKey}_time`);
  const now = Date.now();
  // Diminuir tempo de cache para 5 minutos para garantir dados mais atualizados
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  // If we have valid cached data and aren't forcing refresh
  if (!forceRefresh && cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
    console.log("Using cached data for top artists");
    return JSON.parse(cachedData);
  }
  
  console.log("Buscando artistas favoritos em tempo real da API do Spotify");
  
  // Otherwise, fetch new data
  const data = await spotifyFetch<TopItemsResponse<SpotifyArtist>>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`
  );
  
  // Save to cache for future use
  localStorage.setItem(cacheKey, JSON.stringify(data));
  localStorage.setItem(`${cacheKey}_time`, now.toString());
  
  return data;
};

/**
 * Get user's top tracks
 * Modified to always get real-time data with configurable cache
 */
export const getTopTracks = async (
  timeRange: TimeRange = "short_term",
  limit: number = 50,
  forceRefresh: boolean = true
): Promise<TopItemsResponse<SpotifyTrack>> => {
  // Check if we have cached data and can use it
  const cacheKey = `top_tracks_${timeRange}_${limit}`;
  const cachedData = localStorage.getItem(cacheKey);
  const cacheTime = localStorage.getItem(`${cacheKey}_time`);
  const now = Date.now();
  // Diminuir tempo de cache para 5 minutos para garantir dados mais atualizados
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  // If we have valid cached data and aren't forcing refresh
  if (!forceRefresh && cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
    console.log("Using cached data for top tracks");
    return JSON.parse(cachedData);
  }
  
  console.log("Buscando músicas favoritas em tempo real da API do Spotify");
  
  // Otherwise, fetch new data
  const data = await spotifyFetch<TopItemsResponse<SpotifyTrack>>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
  );
  
  // Save to cache for future use
  localStorage.setItem(cacheKey, JSON.stringify(data));
  localStorage.setItem(`${cacheKey}_time`, now.toString());
  
  return data;
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
