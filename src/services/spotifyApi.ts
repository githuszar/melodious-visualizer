
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
    console.log(`Inicializando coleta de dados - Login ID: ${loginTimestamp}`);
    
    // Get user profile with error handling
    let user;
    try {
      user = await getCurrentUser();
      console.log("Dados de usuário obtidos com sucesso:", user.id);
    } catch (error) {
      console.error("Erro ao obter dados do usuário atual:", error);
      throw new Error("Não foi possível obter seu perfil do Spotify. Por favor, tente novamente.");
    }
    
    let userProfile;
    try {
      userProfile = await getUserProfile();
      console.log("Perfil do usuário obtido com sucesso:", userProfile.name);
    } catch (error) {
      console.error("Erro ao obter perfil do usuário:", error);
      throw new Error("Não foi possível obter seu perfil do Spotify. Por favor, tente novamente.");
    }
    
    console.log("Obtendo dados em tempo real do Spotify para o usuário:", userProfile.name);
    
    // Get top artists and tracks with error handling
    let topArtistsResponse;
    try {
      topArtistsResponse = await getTopArtists("short_term", 50, forceRefresh);
      console.log(`Artistas favoritos obtidos: ${topArtistsResponse.items.length}`);
    } catch (error) {
      console.error("Erro ao obter artistas favoritos:", error);
      throw new Error("Não foi possível obter seus artistas favoritos. Por favor, tente novamente.");
    }
    
    let topTracksResponse;
    try {
      topTracksResponse = await getTopTracks("short_term", 50, forceRefresh);
      console.log(`Músicas favoritas obtidas: ${topTracksResponse.items.length}`);
    } catch (error) {
      console.error("Erro ao obter músicas favoritas:", error);
      throw new Error("Não foi possível obter suas músicas favoritas. Por favor, tente novamente.");
    }
    
    // Get user playlists with error handling
    let userPlaylistsResponse;
    try {
      userPlaylistsResponse = await getUserPlaylists(20);
      console.log(`Playlists obtidas: ${userPlaylistsResponse.items.length}`);
    } catch (error) {
      console.error("Erro ao obter playlists:", error);
      // Não falhar se as playlists não puderem ser obtidas
      userPlaylistsResponse = { items: [] };
    }
    
    const topArtists = topArtistsResponse.items;
    const topTracks = topTracksResponse.items;
    const userPlaylists = userPlaylistsResponse.items;
    
    // Extract track IDs for audio features
    const trackIds = topTracks.slice(0, 50).map(track => track.id);
    
    // Get audio features for tracks with error handling
    let audioFeatures = [];
    try {
      if (trackIds.length > 0) {
        const audioFeaturesResponse = await getAudioFeatures(trackIds);
        audioFeatures = audioFeaturesResponse.audio_features.filter(Boolean);
        console.log(`Características de áudio obtidas: ${audioFeatures.length}`);
      }
    } catch (error) {
      console.error("Erro ao obter características de áudio:", error);
      // Continuar mesmo sem características de áudio
    }
    
    // Extract top genres
    const topGenres = extractTopGenres(topArtists);
    
    // Calculate music index based on audio features
    const musicIndex = calculateMusicIndex(
      audioFeatures, 
      topGenres, 
      { id: user.id, timestamp: loginTimestamp }
    );
    
    console.log("Gerando perfil musical único com timestamp:", loginTimestamp);
    console.log("Score único gerado:", musicIndex.uniqueScore);
    console.log("Seed de imagem única:", musicIndex.imageSeed);
    
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
      console.warn("Não foi possível salvar dados localmente:", localSaveError);
    }
    
    // Return the complete data
    return userMusicData;
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    throw new Error("Falha ao buscar dados da API do Spotify: " + 
      (error instanceof Error ? error.message : "Erro desconhecido"));
  }
};
