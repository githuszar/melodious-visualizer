
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
    console.log("[AUTH] Iniciando processo de login com Spotify");
    
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
    
    console.log("[AUTH] URL de redirecionamento configurada:", REDIRECT_URI);
    console.log("[AUTH] Client ID utilizado:", CLIENT_ID);
    console.log("[AUTH] Escopos solicitados:", SCOPES);
    
    // Redirect to Spotify auth page
    const authUrl = `${AUTH_ENDPOINT}?${params.toString()}`;
    console.log("[AUTH] Redirecionando para URL de autenticação:", authUrl);
    window.location.href = authUrl;
  } catch (error) {
    console.error("[AUTH] Erro ao iniciar login:", error);
    throw error;
  }
};

/**
 * Handle Spotify callback and exchange code for tokens
 */
export const handleSpotifyCallback = async (): Promise<boolean> => {
  try {
    console.log("[CALLBACK] Iniciando processamento do callback do Spotify...");
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
    
    console.log("[CALLBACK] Parâmetros recebidos:");
    console.log("[CALLBACK] - Código de autorização presente:", !!code);
    if (code) {
      console.log("[CALLBACK] - Tamanho do código:", code.length);
      console.log("[CALLBACK] - Amostra do código:", code.substring(0, 5) + "..." + code.substring(code.length - 5));
    }
    console.log("[CALLBACK] - Estado presente:", !!state);
    console.log("[CALLBACK] - Estado armazenado presente:", !!storedState);
    
    if (!code) {
      console.error("[CALLBACK] Erro na autenticação: código de autorização ausente");
      return false;
    }
    
    if (!state) {
      console.error("[CALLBACK] Erro na autenticação: estado ausente");
      return false;
    }
    
    if (!storedState) {
      console.error("[CALLBACK] Erro na autenticação: estado armazenado ausente");
      return false;
    }
    
    if (state !== storedState) {
      console.error("[CALLBACK] Erro na autenticação: CSRF - estados não correspondem");
      console.error("[CALLBACK] Estado recebido:", state);
      console.error("[CALLBACK] Estado armazenado:", storedState);
      return false;
    }
    
    console.log("[CALLBACK] Validação de estado bem-sucedida, removendo estado armazenado");
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    
    // Exchange code for tokens - this function is in token.ts
    console.log("[CALLBACK] Trocando código por tokens...");
    const success = await exchangeCodeForTokens(code);
    console.log("[CALLBACK] Resultado da troca de código por tokens:", success ? "Sucesso" : "Falha");
    
    // Verificar se o token está realmente disponível após a troca
    if (success) {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      console.log("[CALLBACK] Token após troca:", token ? "PRESENTE" : "AUSENTE");
      
      if (!token) {
        console.error("[CALLBACK] Token não foi salvo corretamente após troca bem-sucedida");
        return false;
      }
    }
    
    return success;
  } catch (error) {
    console.error("[CALLBACK] Erro ao processar callback:", error);
    if (error instanceof Error) {
      console.error("[CALLBACK] Mensagem de erro:", error.message);
    }
    return false;
  }
};

/**
 * Logout by removing tokens from local storage
 */
export const logout = async (): Promise<void> => {
  clearAllStoredData();
  console.log("[AUTH] Usuário deslogado, todos os dados removidos");
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const token = await getToken();
    const isLogged = token !== null;
    console.log("[AUTH] Verificação de login:", isLogged ? "Usuário logado" : "Usuário não logado");
    return isLogged;
  } catch (error) {
    console.error("[AUTH] Erro ao verificar status de login:", error);
    return false;
  }
};

/**
 * Clear all Spotify-related data from local storage
 */
export const clearAllStoredData = (): void => {
  console.log("[AUTH] Limpando todos os dados armazenados");
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
    console.log(`[AUTH] Dado removido: ${key}`);
  });
};
