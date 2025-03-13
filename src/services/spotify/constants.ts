
// Spotify API Endpoints & Credentials
export const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
export const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
export const CLIENT_ID = "e983ab76967541819658cb3126d9f3df";
export const CLIENT_SECRET = "4f4d1a7a3697434db2a0edc2c484f80c";
export const REDIRECT_URI = "https://melodious-visualizer.lovable.app/callback";
export const SCOPES = "user-read-email user-read-private user-top-read playlist-read-private playlist-read-collaborative user-library-read";

// LocalStorage Keys
export const STORAGE_KEYS = {
  TOKEN: "spotify_token",
  REFRESH_TOKEN: "spotify_refresh_token",
  TOKEN_EXPIRY: "spotify_token_expiry",
  AUTH_STATE: "spotify_auth_state",
  USER: "spotify_user",
  LAST_LOGIN_TIME: "spotify_last_login_time",
  MUSIC_IMAGE: "music_image",
  MUSIC_USER_DATA: "music_user_data"
};

/**
 * Generates a random string for state parameter
 */
export const generateRandomString = (length: number): string => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
