
import { SpotifyAuthResponse } from "@/types/spotify";
import { toast } from "sonner";

// Spotify API configuration
const CLIENT_ID = "e983ab76967541819658cb3126d9f3df";
const CLIENT_SECRET = "4f4d1a7a3697434db2a0edc2c484f80c";
const REDIRECT_URI = "https://your-music-image.lovable.app/callback";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "user-read-recently-played"
];

// Auth storage keys
const TOKEN_KEY = "spotify_token";
const TOKEN_EXPIRY_KEY = "spotify_token_expiry";

/**
 * Initiates the Spotify OAuth flow
 */
export const initiateSpotifyLogin = () => {
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
    
    // Save the token and its expiry time
    const expiryTime = Date.now() + tokenResponse.expires_in * 1000;
    localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
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
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || 'Failed to exchange token');
    }
    
    return response.json();
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

/**
 * Get the current access token
 */
export const getAccessToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return null;
  }
  
  // Check if the token has expired
  if (Date.now() > parseInt(expiryTime)) {
    // Token expired
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }
  
  return token;
};

/**
 * Check if the user is logged in
 */
export const isLoggedIn = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Logout the user
 */
export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  toast.info("Logged out from Spotify");
};
