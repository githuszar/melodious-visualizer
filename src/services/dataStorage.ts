
import { UserMusicData } from "@/types/spotify";

// Local storage keys
const USER_DATA_KEY = "music_user_data";

/**
 * Save user music data to local storage
 */
export const saveUserMusicData = (data: UserMusicData): void => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
};

/**
 * Get user music data from local storage
 */
export const getUserMusicData = (): UserMusicData | null => {
  const data = localStorage.getItem(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
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
 * Clear all stored data
 */
export const clearStoredData = (): void => {
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem("music_image");
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
