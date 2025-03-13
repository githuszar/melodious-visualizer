
import axios from "axios";
import { getAccessToken } from "@/services/spotify";

const BASE_URL = "https://api.spotify.com/v1";

/**
 * Make authenticated request to Spotify API
 */
export const spotifyFetch = async <T>(endpoint: string, options = {}): Promise<T> => {
  try {
    const token = await getAccessToken();
    
    if (!token) {
      console.error("Falha na autenticação: Token não disponível");
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
      if (axios.isAxiosError(error)) {
        console.error(`Erro na requisição Spotify (${endpoint}):`, 
          error.response?.status, 
          error.response?.data?.error?.message || error.message
        );
        
        // Verificar se o erro é de autenticação
        if (error.response?.status === 401) {
          localStorage.removeItem("spotify_token");
          localStorage.removeItem("spotify_token_expiry");
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
      }
      throw error;
    }
  } catch (error) {
    console.error(`Erro ao buscar ${endpoint}:`, error);
    throw error;
  }
};
