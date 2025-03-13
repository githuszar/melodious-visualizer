
import axios from "axios";
import { getAccessToken } from "@/services/spotify";

const BASE_URL = "https://api.spotify.com/v1";

/**
 * Make authenticated request to Spotify API
 */
export const spotifyFetch = async <T>(endpoint: string, options = {}): Promise<T> => {
  try {
    console.log(`[API] Iniciando requisição para endpoint: ${endpoint}`);
    const token = await getAccessToken();
    
    if (!token) {
      console.error("[API] Falha na autenticação: Token não disponível");
      throw new Error("No access token available");
    }
    
    console.log(`[API] Token obtido com sucesso, enviando requisição para ${BASE_URL}${endpoint}`);
    
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        ...options
      });
      
      console.log(`[API] Resposta recebida de ${endpoint} com status: ${response.status}`);
      
      if (endpoint === "/me") {
        console.log("[API] Dados do perfil recebidos:", {
          id: response.data.id,
          display_name: response.data.display_name,
          email: response.data.email ? "presente" : "ausente",
          images: response.data.images ? response.data.images.length + " imagens" : "nenhuma imagem"
        });
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`[API] Erro na requisição Spotify (${endpoint}):`, 
          error.response?.status, 
          error.response?.data?.error?.message || error.message
        );
        
        // Exibir headers de resposta sem expor dados sensíveis
        if (error.response?.headers) {
          console.error("[API] Headers de resposta:", {
            "content-type": error.response.headers["content-type"],
            "www-authenticate": error.response.headers["www-authenticate"]
          });
        }
        
        // Detalhes completos do erro
        if (error.response?.data) {
          console.error("[API] Detalhes completos do erro:", JSON.stringify(error.response.data));
        }
        
        // Verificar se o erro é de autenticação
        if (error.response?.status === 401) {
          console.error("[API] Erro de autenticação 401 - Token inválido ou expirado");
          localStorage.removeItem("spotify_token");
          localStorage.removeItem("spotify_token_expiry");
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
        
        // Verificar problemas específicos de permissão
        if (error.response?.status === 403) {
          console.error("[API] Erro de permissão 403 - Verifique se os scopes necessários estão configurados");
          throw new Error("Sem permissão para acessar este recurso. Por favor, faça login novamente.");
        }
      }
      throw error;
    }
  } catch (error) {
    console.error(`[API] Erro ao buscar ${endpoint}:`, error);
    
    // Mensagem de erro mais detalhada
    if (error instanceof Error) {
      throw new Error(`Falha ao acessar a API do Spotify (${endpoint}): ${error.message}`);
    } else {
      throw new Error(`Falha ao acessar a API do Spotify (${endpoint})`);
    }
  }
};
