
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
const LAST_LOGIN_TIME_KEY = "spotify_last_login_time";

/**
 * Initiates the Spotify OAuth flow
 */
export const initiateSpotifyLogin = () => {
  console.log("Iniciando processo de login do Spotify");
  
  // Limpar quaisquer tokens existentes para garantir nova autenticação
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("spotify_auth_state");
  localStorage.removeItem(LAST_LOGIN_TIME_KEY);
  localStorage.removeItem("music_user_data");
  localStorage.removeItem("music_image");
  
  // Generate a random state value for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem("spotify_auth_state", state);
  console.log("Estado de autenticação gerado:", state);

  // Construct the authorization URL
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.append("client_id", CLIENT_ID);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("scope", SCOPES.join(" "));
  authUrl.searchParams.append("state", state);
  // Forçar tela de login do Spotify, garantindo que sempre solicite autenticação
  authUrl.searchParams.append("show_dialog", "true");

  console.log("URL de autenticação do Spotify:", authUrl.toString());
  
  // Redirect to Spotify auth page
  window.location.href = authUrl.toString();
};

/**
 * Handles the callback from Spotify OAuth
 */
export const handleSpotifyCallback = async (): Promise<boolean> => {
  console.log("Manipulando callback do Spotify");
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const storedState = localStorage.getItem("spotify_auth_state");
  const error = urlParams.get("error");

  console.log("Parâmetros do callback:", { 
    code: code ? "presente" : "ausente", 
    state: state, 
    storedState: storedState,
    error: error 
  });

  // Clean URL parameters
  window.history.replaceState({}, document.title, window.location.pathname);

  // Check for errors or CSRF attack
  if (error) {
    console.error("Erro na autenticação:", error);
    toast.error("Authentication failed: " + error);
    return false;
  }

  if (!code || !state || state !== storedState) {
    if (!code) {
      console.error("Código de autenticação ausente");
      toast.error("Authentication code missing");
    }
    if (state !== storedState) {
      console.error("Verificação de estado falhou. Estado recebido:", state, "Estado armazenado:", storedState);
      toast.error("State verification failed");
    }
    return false;
  }

  // Clear the stored state
  localStorage.removeItem("spotify_auth_state");

  try {
    console.log("Trocando código por token...");
    // Exchange code for token
    const tokenResponse = await getSpotifyToken(code);
    console.log("Token obtido com sucesso");
    
    // Save the token, refresh token and its expiry time
    const expiryTime = Date.now() + tokenResponse.expires_in * 1000;
    localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    localStorage.setItem(LAST_LOGIN_TIME_KEY, Date.now().toString());
    
    console.log("Token salvo com sucesso. Expira em:", new Date(expiryTime).toLocaleString());
    
    // Save refresh token if available
    if (tokenResponse.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
      console.log("Token de atualização salvo com sucesso");
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
    console.log("Enviando solicitação para obter token");
    const response = await axios.post(tokenUrl, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    console.log("Resposta de token recebida:", { 
      access_token: response.data.access_token ? "presente" : "ausente",
      refresh_token: response.data.refresh_token ? "presente" : "ausente",
      expires_in: response.data.expires_in
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
    console.error("Nenhum token de atualização disponível");
    throw new Error("No refresh token available");
  }
  
  console.log("Tentando atualizar o token de acesso");
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
    
    console.log("Token atualizado com sucesso");
    
    // Save the new access token and expiry time
    const expiryTime = Date.now() + response.data.expires_in * 1000;
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // If we got a new refresh token, save it
    if (response.data.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
      console.log("Novo token de atualização salvo");
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
  
  console.log("Verificando token:", { 
    token: token ? "existe" : "não existe", 
    expiryTime: expiryTime ? "existe" : "não existe" 
  });
  
  if (!token || !expiryTime) {
    console.log("Token ou tempo de expiração ausente");
    return null;
  }
  
  // Check if the token has expired or will expire in the next 5 minutes
  const isExpiringSoon = Date.now() > (parseInt(expiryTime) - 300000); // 5 minutes buffer
  
  if (isExpiringSoon) {
    try {
      console.log("Token expirando em breve, tentando atualizar...");
      // Try to refresh the token
      const refreshResponse = await refreshAccessToken();
      console.log("Token atualizado com sucesso");
      return refreshResponse.access_token;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Clear the token storage on refresh failure
      await clearStoredData(); // Limpeza completa em caso de falha
      return null;
    }
  }
  
  console.log("Token válido encontrado");
  return token;
};

/**
 * Check if the user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    console.log("Verificando status de login...");
    const token = await getAccessToken();
    const isValid = token !== null;
    console.log("Status de login verificado:", isValid);
    
    // Se temos um token válido, verificar também se temos a data do último login
    if (isValid) {
      const lastLoginTime = localStorage.getItem(LAST_LOGIN_TIME_KEY);
      console.log("Último login:", lastLoginTime ? new Date(parseInt(lastLoginTime)).toLocaleString() : "nunca");
    }
    
    return isValid;
  } catch (error) {
    console.error("Erro ao verificar status de login:", error);
    return false;
  }
};

/**
 * Logout the user and clear all stored data
 */
export const logout = async (): Promise<void> => {
  try {
    console.log("Iniciando processo de logout");
    // Limpar todos os dados armazenados (incluindo tokens)
    await clearStoredData();
    
    toast.success("Desconectado do Spotify com sucesso");
    
    // Redirecionar para a página de logout do Spotify para forçar o logout na sessão do Spotify
    const spotifyLogoutUrl = "https://www.spotify.com/logout/";
    const returnUrl = window.location.origin;
    
    // Criar um iframe oculto para fazer o logout do Spotify sem sair da página
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = spotifyLogoutUrl;
    document.body.appendChild(iframe);
    
    // Quando o iframe terminar de carregar, removê-lo e redirecionar para a página inicial
    iframe.onload = () => {
      document.body.removeChild(iframe);
      window.location.href = returnUrl;
    };
    
    // Caso o iframe falhe após 3 segundos, forçar o redirecionamento
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
        window.location.href = returnUrl;
      }
    }, 3000);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    toast.error("Erro ao desconectar. Alguns dados podem não ter sido limpos.");
    
    // Mesmo em caso de erro, redirecionar para a página inicial
    window.location.href = window.location.origin;
  }
};
