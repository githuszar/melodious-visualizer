
import axios from "axios";
import { getAccessToken } from "../spotifyAuth";

const BASE_URL = "https://api.spotify.com/v1";

/**
 * Make authenticated request to Spotify API
 */
export const spotifyFetch = async <T>(endpoint: string, options = {}): Promise<T> => {
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
