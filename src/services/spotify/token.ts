
import axios from "axios";
import { 
  TOKEN_ENDPOINT, 
  CLIENT_ID, 
  CLIENT_SECRET, 
  REDIRECT_URI,
  STORAGE_KEYS 
} from "./constants";

/**
 * Exchange authorization code for access and refresh tokens
 */
export const exchangeCodeForTokens = async (code: string): Promise<boolean> => {
  try {
    const tokenResponse = await axios.post(
      TOKEN_ENDPOINT,
      new URLSearchParams({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log("Resposta da API de token:", tokenResponse.status);
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, (Date.now() + expires_in * 1000).toString());
    
    console.log("Autenticação bem-sucedida, tokens salvos");
    return true;
  } catch (error) {
    console.error("Erro ao obter tokens:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Detalhes do erro:", error.response.data);
    }
    return false;
  }
};

/**
 * Refresh access token using the refresh token
 */
export const refreshToken = async (): Promise<void> => {
  try {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      console.error("Refresh token não encontrado");
      throw new Error("Refresh token not found");
    }
    
    const tokenResponse = await axios.post(
      TOKEN_ENDPOINT,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    const { access_token, expires_in } = tokenResponse.data;
    
    localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, (Date.now() + expires_in * 1000).toString());
    
    console.log("Token renovado com sucesso");
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    throw error;
  }
};

/**
 * Get current access token, refreshing if necessary
 */
export const getToken = async (): Promise<string | null> => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  
  if (!token || !expiryTime) {
    console.log("Não autenticado: token ou tempo de expiração ausentes");
    return null;
  }
  
  if (Date.now() >= parseInt(expiryTime, 10)) {
    console.log("Token expirado, tentando renovar");
    
    try {
      await refreshToken();
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error("Falha ao renovar token:", error);
      clearTokens();
      return null;
    }
  }
  
  return token;
};

/**
 * Get current access token without refresh attempts
 */
export const getAccessToken = async (): Promise<string | null> => {
  return getToken();
};

/**
 * Clear tokens from local storage
 */
export const clearTokens = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
};
