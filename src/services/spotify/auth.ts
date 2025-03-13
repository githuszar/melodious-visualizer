import axios from "axios";
import { 
  AUTH_ENDPOINT, 
  CLIENT_ID, 
  REDIRECT_URI, 
  SCOPES, 
  generateRandomString,
  STORAGE_KEYS
} from "./constants";
import { getToken, clearTokens, exchangeCodeForTokens } from "./token";

/**
 * Initiate Spotify login process
 */
export const initiateSpotifyLogin = () => {
  try {
    console.log("Iniciando processo de login com Spotify");
    
    // Clear any existing tokens and data when initiating a new login
    clearAllStoredData();
    
    // Generate a random state for CSRF protection
    const state = generateRandomString(16);
    localStorage.setItem(STORAGE_KEYS.AUTH_STATE, state);
    
    // Set up auth parameters
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      state: state,
      show_dialog: "true" // Forçar diálogo de login para sempre gerar nova autenticação
    });
    
    console.log("URL de redirecionamento: ", REDIRECT_URI);
    console.log("Client ID: ", CLIENT_ID);
    
    // Redirect to Spotify auth page
    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
  } catch (error) {
    console.error("Erro ao iniciar login:", error);
    throw error;
  }
};

/**
 * Handle Spotify callback and exchange code for tokens
 */
export const handleSpotifyCallback = async (): Promise<boolean> => {
  try {
    console.log("Iniciando callback do Spotify...");
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
    
    if (!code || !state || state !== storedState) {
      console.error("Erro na autenticação: código, estado inválido ou CSRF");
      return false;
    }
    
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    
    // Exchange code for tokens - this function is in token.ts
    const success = await exchangeCodeForTokens(code);
    return success;
  } catch (error) {
    console.error("Erro ao processar callback:", error);
    return false;
  }
};

/**
 * Logout by removing tokens from local storage
 */
export const logout = async (): Promise<void> => {
  clearAllStoredData();
  console.log("Usuário deslogado");
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await getToken();
    return token !== null;
  } catch (error) {
    console.error("Erro ao verificar status de login:", error);
    return false;
  }
};

/**
 * Clear all Spotify-related data from local storage
 */
export const clearAllStoredData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
