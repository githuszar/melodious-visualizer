import { UserMusicData } from "@/types/spotify";
import { saveUserMusicDataToDatabase, getAllUserRecords, exportDatabaseToJSON, initializeWithMockDataIfEmpty, clearDatabase } from "./databaseService";

// Local storage keys
const USER_DATA_KEY = "music_user_data";

/**
 * Inicializar o banco de dados se necessário
 */
export const initializeDatabase = async (): Promise<void> => {
  await initializeWithMockDataIfEmpty();
};

/**
 * Limpar todos os dados armazenados, incluindo o banco de dados
 */
export const clearStoredData = async (): Promise<void> => {
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem("music_image");
  // Limpar o banco de dados para garantir que dados frescos serão utilizados
  await clearDatabase();
  console.log("Dados de usuário limpos do localStorage e banco de dados");
};

/**
 * Save user music data to local storage and database
 */
export const saveUserMusicData = (data: UserMusicData): void => {
  // Salvar no localStorage para acesso rápido
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
  
  // Salvar no banco de dados IndexedDB
  saveUserMusicDataToDatabase(data);
};

/**
 * Get user music data from local storage
 */
export const getUserMusicData = (): UserMusicData | null => {
  const data = localStorage.getItem(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

/**
 * Exportar toda a base de dados para JSON
 */
export const exportDatabaseJSON = async (): Promise<string> => {
  const data = await exportDatabaseToJSON();
  return JSON.stringify(data, null, 2);
};

/**
 * Save generated image to local storage
 */
export const saveGeneratedImage = (dataUrl: string): void => {
  localStorage.setItem("music_image", dataUrl);
};

/**
 * Get generated image from local storage
 */
export const getGeneratedImage = (): string | null => {
  return localStorage.getItem("music_image");
};

/**
 * Download the generated image
 */
export const downloadImage = (dataUrl: string, filename = "your-music-image.png"): void => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Share image to social media
 * Note: This is a simplified implementation
 */
export const shareImage = async (dataUrl: string, platform: string): Promise<boolean> => {
  try {
    // Convert dataUrl to blob for sharing
    const blob = await (await fetch(dataUrl)).blob();
    
    // Use Web Share API if available
    if (navigator.share && platform === "native") {
      await navigator.share({
        title: "My Music Visualization",
        text: "Check out this unique visualization of my music taste!",
        files: [new File([blob], "your-music-image.png", { type: "image/png" })]
      });
      return true;
    }
    
    // Platform-specific sharing (simplified)
    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=My%20unique%20music%20visualization%20from%20YourMusicImage!&hashtags=music,visualization`, "_blank");
        return true;
      
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
        return true;
        
      default:
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText("Check out my music visualization at https://your-music-image.lovable.app/");
        return true;
    }
  } catch (error) {
    console.error("Sharing failed:", error);
    return false;
  }
};
