
import { SpotifyAuthResponse } from "@/types/spotify";
import { toast } from "sonner";

// Spotify API configuration
const CLIENT_ID = "e983ab76967541819658cb3126d9f3df";
const REDIRECT_URI = window.location.origin;
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
    // Exchange code for token using a proxy endpoint
    // Note: In a production app, this should be handled by a backend service
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
 * Note: In a real app, this should be done server-side
 */
const getSpotifyToken = async (code: string): Promise<SpotifyAuthResponse> => {
  // Warning: This is a client-side implementation for demo purposes only
  // The client secret should never be exposed in client-side code
  // In a production environment, use a server-side proxy endpoint
  
  const params = new URLSearchParams();
  params.append("client_id", CLIENT_ID);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", REDIRECT_URI);
  
  // This is a mock implementation that simulates a successful token exchange
  // In a real app, you would make an actual API call to Spotify's token endpoint
  
  // Simulated response for demo purposes
  return {
    access_token: "mock_access_token_" + Math.random().toString(36).substring(2),
    token_type: "Bearer",
    expires_in: 3600,
    scope: SCOPES.join(" ")
  };
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
