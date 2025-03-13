
import { SpotifyUser, UserProfile } from "@/types/spotify";
import { spotifyFetch } from "./spotifyBaseApi";

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
 * Get user's playlists
 */
export const getUserPlaylists = async (limit: number = 20): Promise<any> => {
  return spotifyFetch(
    `/me/playlists?limit=${limit}`
  );
};

/**
 * Get user's saved tracks
 */
export const getUserSavedTracks = async (limit: number = 20): Promise<any> => {
  return spotifyFetch(
    `/me/tracks?limit=${limit}`
  );
};
