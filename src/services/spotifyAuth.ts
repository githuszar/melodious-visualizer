
import axios from "axios";

// Spotify API Endpoints & Credentials
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
// Use a URI de redirecionamento exata que foi configurada no painel do Spotify Developer
const REDIRECT_URI = "https://melodious-visualizer.lovable.app/callback";
const SCOPES = "user-read-email user-read-private user-top-read playlist-read-private playlist-read-collaborative user-library-read";

/**
 * Generates a random string for state parameter
 */
const generateRandomString = (length: number): string => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

/**
 * Initiate Spotify login process
 */
export const initiateSpotifyLogin = () => {
  try {
    console.log("Iniciando processo de login com Spotify");
    
    // Clear any existing tokens and data when initiating a new login
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_token_expiry");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_user");
    localStorage.removeItem("music_image");
    localStorage.removeItem("music_user_data");
    
    // Generate a random state for CSRF protection
    const state = generateRandomString(16);
    localStorage.setItem("spotify_auth_state", state);
    
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
    const storedState = localStorage.getItem('spotify_auth_state');
    
    if (!code || !state || state !== storedState) {
      console.error("Erro na autenticação: código, estado inválido ou CSRF");
      return false;
    }
    
    localStorage.removeItem('spotify_auth_state');
    
    // Usar a mesma URL de redirecionamento que foi usada na autorização inicial
    const tokenResponse = await axios.post(
      TOKEN_ENDPOINT,
      new URLSearchParams({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    localStorage.setItem('spotify_token', access_token);
    localStorage.setItem('spotify_refresh_token', refresh_token);
    localStorage.setItem('spotify_token_expiry', (Date.now() + expires_in * 1000).toString());
    
    console.log("Autenticação bem-sucedida, tokens salvos");
    return true;
  } catch (error) {
    console.error("Erro ao obter tokens:", error);
    return false;
  }
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  const token = localStorage.getItem('spotify_token');
  const expiryTime = localStorage.getItem('spotify_token_expiry');
  
  if (!token || !expiryTime) {
    console.log("Não autenticado: token ou tempo de expiração ausentes");
    return false;
  }
  
  if (Date.now() >= parseInt(expiryTime, 10)) {
    console.log("Não autenticado: token expirado");
    
    // Tentativa de renovar o token
    try {
      console.log("Tentando renovar o token...");
      await refreshToken();
      console.log("Token renovado com sucesso");
      return true; // Se a renovação for bem-sucedida, retorna true
    } catch (refreshError) {
      console.error("Erro ao renovar token:", refreshError);
      return false; // Se a renovação falhar, retorna false
    }
  }
  
  console.log("Autenticado: token válido");
  return true;
};

/**
 * Refresh access token using the refresh token
 */
export const refreshToken = async (): Promise<void> => {
  try {
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
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
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    const { access_token, expires_in } = tokenResponse.data;
    
    localStorage.setItem('spotify_token', access_token);
    localStorage.setItem('spotify_token_expiry', (Date.now() + expires_in * 1000).toString());
    
    console.log("Token renovado com sucesso");
  } catch (error) {
    console.error("Erro ao renovar token:", error);
    throw error;
  }
};

/**
 * Logout by removing tokens from local storage
 */
export const logout = async (): Promise<void> => {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_token_expiry');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_auth_state');
  localStorage.removeItem('spotify_user');
  localStorage.removeItem('music_image');
  localStorage.removeItem('music_user_data');
  console.log("Usuário deslogado");
};

/**
 * Get current access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('spotify_token');
  if (!token) {
    console.warn("Access token não encontrado");
    return null;
  }
  return token;
};
