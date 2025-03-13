
import { UserMusicData } from "@/types/spotify";
import { saveUserMusicDataToDatabase, getAllUserRecords, exportDatabaseToJSON, clearDatabase } from "./databaseService";

// Local storage keys
const USER_DATA_KEY = "music_user_data";

/**
 * Inicializar o banco de dados se necessário
 */
export const initializeDatabase = async (): Promise<void> => {
  // Não inicializa com dados mockados, apenas prepara o banco
  try {
    // Verificar se o banco de dados está acessível
    await getAllUserRecords();
    console.log("Banco de dados inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
  }
};

/**
 * Limpar todos os dados armazenados, incluindo o banco de dados
 */
export const clearStoredData = async (): Promise<void> => {
  try {
    // Limpar TODOS os dados relacionados ao Spotify e à autenticação
    const keysToRemove = [
      USER_DATA_KEY,
      "music_image",
      "spotify_token",
      "spotify_token_expiry",
      "spotify_refresh_token",
      "spotify_auth_state",
      "spotify_user",
      "spotify_last_login_time",
      "temp_music_data",
      "music_image_data"
    ];
    
    // Remover cada chave individualmente
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Limpar completamente o sessionStorage
    sessionStorage.clear();
    
    // Limpar todos os cookies relacionados ao Spotify (mais difícil devido a restrições de segurança)
    // Isso é uma tentativa, mas pode não funcionar para cookies HttpOnly
    document.cookie.split(";").forEach(cookie => {
      const [name] = cookie.trim().split("=");
      if (name.includes("spotify")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    
    // Limpar o banco de dados para garantir que dados frescos serão utilizados
    const cleared = await clearDatabase();
    
    if (cleared) {
      console.log("Dados de usuário limpos com sucesso do localStorage, sessionStorage e banco de dados");
    } else {
      console.error("Falha ao limpar o banco de dados");
    }
    
    return;
  } catch (error) {
    console.error("Erro ao limpar dados armazenados:", error);
    throw error;
  }
};

/**
 * Save user music data to local storage and database
 * Também garante que os dados sejam identificados por login único
 */
export const saveUserMusicData = (data: UserMusicData): void => {
  try {
    // Adicionar identificação de login para garantir unicidade
    const dataWithLoginId = {
      ...data,
      loginTimestamp: Date.now(),
      loginId: `login_${Date.now()}`
    };
    
    // Salvar no localStorage para acesso rápido
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(dataWithLoginId));
    
    // Armazenar ID do usuário separadamente para facilitar acesso
    if (data.userId) {
      localStorage.setItem('spotify_user_id', data.userId);
    }
    
    // Salvar no banco de dados IndexedDB
    saveUserMusicDataToDatabase(dataWithLoginId);
    
    console.log("Dados do usuário salvos com identificador de login único:", dataWithLoginId.loginId);
  } catch (error) {
    console.error("Erro ao salvar dados do usuário:", error);
  }
};

/**
 * Get user music data from local storage
 */
export const getUserMusicData = (): UserMusicData | null => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Erro ao obter dados do usuário:", error);
    return null;
  }
};

/**
 * Exportar toda a base de dados para JSON
 */
export const exportDatabaseJSON = async (): Promise<string> => {
  try {
    const data = await exportDatabaseToJSON();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Erro ao exportar banco de dados:", error);
    return JSON.stringify({ error: "Falha ao exportar dados" });
  }
};

/**
 * Save generated image to local storage
 */
export const saveGeneratedImage = (dataUrl: string): void => {
  try {
    localStorage.setItem("music_image", dataUrl);
    
    // Também salvar o timestamp da geração para controle de unicidade
    localStorage.setItem("music_image_timestamp", Date.now().toString());
    console.log("Imagem gerada salva com timestamp único:", Date.now());
  } catch (error) {
    console.error("Erro ao salvar imagem gerada:", error);
  }
};

/**
 * Get generated image from local storage
 */
export const getGeneratedImage = (): string | null => {
  return localStorage.getItem("music_image");
};

/**
 * Download the generated image
 */
export const downloadImage = (dataUrl: string, filename = "your-music-image.png"): void => {
  try {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Download da imagem iniciado com sucesso");
  } catch (error) {
    console.error("Erro ao fazer download da imagem:", error);
  }
};

/**
 * Share image to social media
 * Implementação melhorada com suporte a mais plataformas
 */
export const shareImage = async (dataUrl: string, platform: string): Promise<boolean> => {
  try {
    // Convert dataUrl to blob for sharing
    const blob = await (await fetch(dataUrl)).blob();
    
    // Obter o username para personalizar a mensagem
    const userData = getUserMusicData();
    const username = userData?.userProfile?.name || "Meu";
    
    // Determinar título e texto para compartilhamento
    const title = `${username} perfil musical único`;
    const text = `Confira essa visualização única do meu gosto musical gerada pelo Melodious Visualizer!`;
    
    // Criar URL do site para compartilhamento
    const siteUrl = encodeURIComponent(window.location.origin);
    
    // Use Web Share API if available
    if (navigator.share && platform === "native") {
      await navigator.share({
        title: title,
        text: text,
        files: [new File([blob], "your-music-image.png", { type: "image/png" })]
      });
      console.log("Compartilhado via Web Share API");
      return true;
    }
    
    // Platform-specific sharing
    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${siteUrl}&hashtags=melodiousvisualizer,spotify,music`, "_blank");
        console.log("Compartilhado no Twitter");
        return true;
      
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${siteUrl}&quote=${encodeURIComponent(text)}`, "_blank");
        console.log("Compartilhado no Facebook");
        return true;
        
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + window.location.href)}`, "_blank");
        console.log("Compartilhado no WhatsApp");
        return true;
        
      case "telegram":
        window.open(`https://telegram.me/share/url?url=${siteUrl}&text=${encodeURIComponent(text)}`, "_blank");
        console.log("Compartilhado no Telegram");
        return true;
        
      case "copy":
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        console.log("Link copiado para a área de transferência");
        return true;
        
      default:
        // Tentativa genérica de compartilhamento
        if (navigator.share) {
          await navigator.share({
            title: title,
            text: text,
            url: window.location.href
          });
          return true;
        }
        
        // Último recurso: copiar para área de transferência
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        return true;
    }
  } catch (error) {
    console.error("Erro ao compartilhar:", error);
    return false;
  }
};

/**
 * Gerar dados para o script local Python
 * Esta função tenta criar um arquivo JSON temporário para o script Python
 */
export const generateLocalPythonData = (userData: UserMusicData): boolean => {
  try {
    if (!userData || !userData.musicIndex) {
      console.error("Dados do usuário incompletos para geração de dados Python");
      return false;
    }
    
    const { musicIndex } = userData;
    
    // Criar objeto de dados para o Python
    const pythonData = {
      user_id: userData.userId || `user_${Date.now()}`,
      timestamp: Date.now(),
      music_data: {
        energy: musicIndex.energy,
        valence: musicIndex.valence,
        danceability: musicIndex.danceability,
        acousticness: musicIndex.acousticness,
        uniqueScore: musicIndex.uniqueScore
      }
    };
    
    // Salvar no localStorage (o Python precisaria de um mecanismo para ler isso)
    localStorage.setItem('temp_music_data_for_python', JSON.stringify(pythonData));
    
    console.log("Dados prontos para processamento pelo Python:", pythonData);
    
    // Tentar fazer uma requisição para um servidor local para criar o arquivo
    // Este é um mecanismo hipotético que exigiria um servidor local
    fetch('/api/save-python-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pythonData)
    }).catch(() => {
      // Ignorar erros pois este endpoint provavelmente não existe
      console.log("Nota: Tentativa de salvar dados para Python (pode ser ignorada)");
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao gerar dados para Python:", error);
    return false;
  }
};
