
import { SpotifyAuthResponse } from "@/types/spotify";
import { toast } from "sonner";
import axios from "axios";
import { clearStoredData } from "./dataStorage";

// Spotify API configuration
const CLIENT_ID = "e983ab76967541819658cb3126d9f3df";
const CLIENT_SECRET = "4f4d1a7a3697434db2a0edc2c484f80c";
// Usando URL relativa para o callback para evitar problemas de ambiente
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-read-recently-played",
  "playlist-read-private",
  "playlist-read-collaborative"
];

// Auth storage keys
const TOKEN_KEY = "spotify_token";
const TOKEN_EXPIRY_KEY = "spotify_token_expiry";
const REFRESH_TOKEN_KEY = "spotify_refresh_token";

/**
 * Initiates the Spotify OAuth flow
 */
export const initiateSpotifyLogin = () => {
  // Limpar quaisquer tokens existentes para garantir nova autenticação
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("spotify_auth_state");
  
  // Generate a random state value for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem("spotify_auth_state", state);

  // Construct the authorization URL
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.append("client_id", CLIENT_ID);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("scope", SCOPES.join(" "));
  authUrl.searchParams.append("state", state);
  // Forçar tela de login do Spotify, garantindo que sempre solicite autenticação
  authUrl.searchParams.append("show_dialog", "true");

  // Redirect to Spotify auth page
  window.location.href = authUrl.toString();
};

/**
 * Handles the callback from Spotify OAuth
 */
export const handleSpotifyCallback = async (): Promise<boolean> => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const storedState = localStorage.getItem("spotify_auth_state");
  const error = urlParams.get("error");

  // Clean URL parameters
  window.history.replaceState({}, document.title, window.location.pathname);

  // Check for errors or CSRF attack
  if (error) {
    toast.error("Authentication failed: " + error);
    return false;
  }

  if (!code || !state || state !== storedState) {
    if (!code) toast.error("Authentication code missing");
    if (state !== storedState) toast.error("State verification failed");
    return false;
  }

  // Clear the stored state
  localStorage.removeItem("spotify_auth_state");

  try {
    // Exchange code for token
    const tokenResponse = await getSpotifyToken(code);
    
    // Save the token, refresh token and its expiry time
    const expiryTime = Date.now() + tokenResponse.expires_in * 1000;
    localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Save refresh token if available
    if (tokenResponse.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
    }
    
    toast.success("Successfully connected to Spotify!");
    return true;
  } catch (error) {
    console.error("Token exchange error:", error);
    toast.error("Failed to complete authentication");
    return false;
  }
};

/**
 * Exchange authorization code for access token
 */
const getSpotifyToken = async (code: string): Promise<SpotifyAuthResponse> => {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  
  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('code', code);
  body.append('redirect_uri', REDIRECT_URI);
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', CLIENT_SECRET);
  
  try {
    const response = await axios.post(tokenUrl, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

/**
 * Refresh the access token using refresh token
 */
const refreshAccessToken = async (): Promise<SpotifyAuthResponse> => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  
  const body = new URLSearchParams();
  body.append('grant_type', 'refresh_token');
  body.append('refresh_token', refreshToken);
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', CLIENT_SECRET);
  
  try {
    const response = await axios.post(tokenUrl, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Save the new access token and expiry time
    const expiryTime = Date.now() + response.data.expires_in * 1000;
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // If we got a new refresh token, save it
    if (response.data.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

/**
 * Get the current access token, refreshing if necessary
 */
export const getAccessToken = async (): Promise<string | null> => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return null;
  }
  
  // Check if the token has expired or will expire in the next 5 minutes
  const isExpiringSoon = Date.now() > (parseInt(expiryTime) - 300000); // 5 minutes buffer
  
  if (isExpiringSoon) {
    try {
      // Try to refresh the token
      const refreshResponse = await refreshAccessToken();
      return refreshResponse.access_token;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Clear the token storage on refresh failure
      await clearStoredData(); // Limpeza completa em caso de falha
      return null;
    }
  }
  
  return token;
};

/**
 * Check if the user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  return await getAccessToken() !== null;
};

/**
 * Logout the user and clear all stored data
 */
export const logout = async (): Promise<void> => {
  try {
    // Limpar todos os dados armazenados (incluindo tokens)
    await clearStoredData();
    
    toast.success("Desconectado do Spotify com sucesso");
    
    // Redirecionar para a página de logout do Spotify para forçar o logout na sessão do Spotify
    // e depois voltar para a página inicial da aplicação
    window.location.href = "https://www.spotify.com/logout/";
    
    // Não precisamos do setTimeout aqui porque o navegador será redirecionado pelo Spotify
    // quando o logout for concluído
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    toast.error("Erro ao desconectar. Alguns dados podem não ter sido limpos.");
  }
};
