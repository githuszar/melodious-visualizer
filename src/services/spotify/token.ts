
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
    console.log("[TOKEN] Iniciando troca de código por tokens");
    console.log("[TOKEN] Usando REDIRECT_URI:", REDIRECT_URI);
    
    const params = new URLSearchParams({
      code: code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });
    
    console.log("[TOKEN] Enviando requisição para:", TOKEN_ENDPOINT);
    console.log("[TOKEN] Com parâmetros:", {
      code: code.substring(0, 5) + "..." + code.substring(code.length - 5), // Log parte do código para debug
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET.substring(0, 3) + "..." + CLIENT_SECRET.substring(CLIENT_SECRET.length - 3) // Log parte do segredo
    });
    
    const tokenResponse = await axios.post(
      TOKEN_ENDPOINT,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log("[TOKEN] Resposta da API de token - Status:", tokenResponse.status);
    
    if (tokenResponse.data) {
      console.log("[TOKEN] Tokens recebidos com sucesso");
      console.log("[TOKEN] Dados recebidos:", {
        access_token: tokenResponse.data.access_token ? "PRESENTE (" + tokenResponse.data.access_token.substring(0, 5) + "...)" : "AUSENTE",
        refresh_token: tokenResponse.data.refresh_token ? "PRESENTE" : "AUSENTE",
        expires_in: tokenResponse.data.expires_in,
        token_type: tokenResponse.data.token_type
      });
    }
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    if (!access_token) {
      console.error("[TOKEN] Erro: access_token ausente na resposta");
      return false;
    }
    
    if (!refresh_token) {
      console.error("[TOKEN] Erro: refresh_token ausente na resposta");
      return false;
    }
    
    if (!expires_in) {
      console.error("[TOKEN] Erro: expires_in ausente na resposta");
      return false;
    }
    
    localStorage.setItem(STORAGE_KEYS.TOKEN, access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, (Date.now() + expires_in * 1000).toString());
    
    console.log("[TOKEN] Autenticação bem-sucedida, tokens salvos");
    console.log("[TOKEN] Token expira em:", new Date(Date.now() + expires_in * 1000).toISOString());
    
    // Teste de validação do token imediatamente após salvá-lo
    try {
      const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      console.log("[TOKEN] Validação do token salvo:", savedToken ? "Presente com " + savedToken.length + " caracteres" : "AUSENTE");
    } catch (validationError) {
      console.error("[TOKEN] Erro ao validar token salvo:", validationError);
    }
    
    return true;
  } catch (error) {
    console.error("[TOKEN] Erro ao obter tokens:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("[TOKEN] Status do erro:", error.response.status);
      console.error("[TOKEN] Detalhes do erro:", JSON.stringify(error.response.data));
      
      if (error.response.status === 400) {
        console.error("[TOKEN] Possível erro nos parâmetros da requisição");
        console.error("[TOKEN] REDIRECT_URI utilizado:", REDIRECT_URI);
        console.error("[TOKEN] CLIENT_ID utilizado:", CLIENT_ID);
      }
    }
    return false;
  }
};

/**
 * Refresh access token using the refresh token
 */
export const refreshToken = async (): Promise<void> => {
  try {
    console.log("[TOKEN] Iniciando renovação de token");
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      console.error("[TOKEN] Refresh token não encontrado");
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
    
    console.log("[TOKEN] Token renovado com sucesso");
    console.log("[TOKEN] Novo token expira em:", new Date(Date.now() + expires_in * 1000).toISOString());
  } catch (error) {
    console.error("[TOKEN] Erro ao renovar token:", error);
    throw error;
  }
};

/**
 * Get current access token, refreshing if necessary
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    
    console.log("[TOKEN] Obtendo token atual - Presente:", !!token);
    
    if (!token || !expiryTime) {
      console.log("[TOKEN] Não autenticado: token ou tempo de expiração ausentes");
      return null;
    }
    
    const expiryTimestamp = parseInt(expiryTime, 10);
    const currentTime = Date.now();
    const timeRemaining = expiryTimestamp - currentTime;
    
    console.log(`[TOKEN] Tempo restante do token: ${Math.floor(timeRemaining / 1000)}s (expira em ${new Date(expiryTimestamp).toISOString()})`);
    
    if (currentTime >= expiryTimestamp) {
      console.log("[TOKEN] Token expirado, tentando renovar");
      
      try {
        await refreshToken();
        const newToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
        console.log("[TOKEN] Token renovado com sucesso:", newToken ? "PRESENTE" : "AUSENTE");
        return newToken;
      } catch (error) {
        console.error("[TOKEN] Falha ao renovar token:", error);
        clearTokens();
        return null;
      }
    }
    
    return token;
  } catch (error) {
    console.error("[TOKEN] Erro ao obter token:", error);
    return null;
  }
};

/**
 * Get current access token without refresh attempts
 */
export const getAccessToken = async (): Promise<string | null> => {
  const token = await getToken();
  
  if (token) {
    console.log("[TOKEN] Token obtido com sucesso:", token.substring(0, 5) + "..." + token.substring(token.length - 5));
  } else {
    console.error("[TOKEN] Falha ao obter token de acesso");
  }
  
  return token;
};

/**
 * Clear tokens from local storage
 */
export const clearTokens = (): void => {
  console.log("[TOKEN] Limpando tokens");
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
};
