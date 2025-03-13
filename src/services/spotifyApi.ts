
import { 
  UserMusicData,
  TimeRange
} from "@/types/spotify";
import { saveGeneratedImage, generateLocalPythonData } from "./dataStorage";
import { saveImageToLocalFile } from "./imageGenerator";
import { getCurrentUser, getUserProfile, getUserPlaylists } from "./api/spotifyUserApi";
import { getTopArtists, getTopTracks, getAudioFeatures } from "./api/spotifyContentApi";
import { extractTopGenres, calculateMusicIndex } from "./musicDataProcessor";

// Re-export API functions for backward compatibility
export { 
  getCurrentUser, 
  getUserProfile, 
  getTopArtists, 
  getTopTracks, 
  getUserPlaylists, 
  getAudioFeatures, 
  extractTopGenres 
};

/**
 * Get real user music data from Spotify API
 * Improved to always fetch fresh data and ensure unique image generation
 */
export const getRealUserMusicData = async (forceRefresh: boolean = true): Promise<UserMusicData> => {
  try {
    // Get unique login timestamp to ensure unique image
    const loginTimestamp = Date.now();
    console.log(`Initializing data collection - Login ID: ${loginTimestamp}`);
    
    // Get user profile
    const user = await getCurrentUser();
    const userProfile = await getUserProfile();
    
    console.log("Getting real-time Spotify data for user:", userProfile.name);
    
    // Get top artists and tracks - force short term for most recent data
    const topArtistsResponse = await getTopArtists("short_term", 50, forceRefresh);
    const topTracksResponse = await getTopTracks("short_term", 50, forceRefresh);
    
    // Get user playlists - increased limit for more data
    const userPlaylistsResponse = await getUserPlaylists(20);
    
    console.log(`Retrieved: ${topArtistsResponse.items.length} artists, ${topTracksResponse.items.length} tracks`);
    
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
    
    // Calculate music index based on audio features
    const musicIndex = calculateMusicIndex(
      audioFeatures, 
      topGenres, 
      { id: user.id, timestamp: loginTimestamp }
    );
    
    console.log("Generating unique musical profile with timestamp:", loginTimestamp);
    console.log("Generated unique score:", musicIndex.uniqueScore);
    console.log("Unique image seed:", musicIndex.imageSeed);
    
    // Create the complete user music data object
    const userMusicData = {
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
    
    // Try to save data for Python script
    try {
      // Try to save the image locally via temporary localStorage
      saveImageToLocalFile(musicIndex);
      
      // Try to generate temporary file for Python
      generateLocalPythonData(userMusicData);
    } catch (localSaveError) {
      console.warn("Could not save data locally:", localSaveError);
    }
    
    // Return the complete data
    return userMusicData;
  } catch (error) {
    console.error("Error fetching real user data:", error);
    throw new Error("Failed to fetch data from Spotify API");
  }
};
