
import { UserDatabase, UserRecord, UserMusicData } from "@/types/spotify";
import { toast } from "sonner";

// Nome da chave para o banco de dados no IndexedDB
const DB_NAME = "music_visualization_db";
const STORE_NAME = "user_records";
const DB_VERSION = 1;
const MAX_USERS = 100;

// Função para inicializar o banco de dados IndexedDB
const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("Não foi possível abrir o banco de dados");
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Criar object store se não existir
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

// Função para obter todos os registros do banco de dados
export const getAllUserRecords = async (): Promise<UserRecord[]> => {
  try {
    const db = await initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const records = request.result || [];
        // Ordenar por timestamp, mais recente primeiro
        const sortedRecords = records.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(sortedRecords);
      };
      
      request.onerror = (event) => {
        console.error("Error getting records:", event);
        reject("Erro ao buscar registros");
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Database error:", error);
    return [];
  }
};

// Função para adicionar um novo registro e manter apenas os 100 mais recentes
export const addUserRecord = async (newRecord: UserRecord): Promise<boolean> => {
  try {
    const db = await initializeDB();
    
    // Primeiro, obter todos os registros existentes
    const existingRecords = await getAllUserRecords();
    
    // Verificar se o registro já existe
    const existingIndex = existingRecords.findIndex(record => record.id === newRecord.id);
    if (existingIndex !== -1) {
      // Se existir, substitui o registro existente
      existingRecords.splice(existingIndex, 1);
    }
    
    // Adicionar o novo registro
    const updatedRecords = [newRecord, ...existingRecords];
    
    // Manter apenas os 100 mais recentes
    const recordsToKeep = updatedRecords.slice(0, MAX_USERS);
    
    // Salvar os registros atualizados
    return new Promise(async (resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      // Limpar o armazenamento
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Adicionar cada registro atualizado
        let addCounter = 0;
        let success = true;
        
        recordsToKeep.forEach((record) => {
          const addRequest = store.add(record);
          
          addRequest.onsuccess = () => {
            addCounter++;
            if (addCounter === recordsToKeep.length) {
              resolve(success);
            }
          };
          
          addRequest.onerror = (event) => {
            console.error("Error adding record:", event, record);
            success = false;
            if (addCounter === recordsToKeep.length) {
              resolve(success);
            }
          };
        });
      };
      
      clearRequest.onerror = (event) => {
        console.error("Error clearing store:", event);
        reject(false);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Database error:", error);
    return false;
  }
};

// Função para converter dados de usuário em formato de registro
export const convertToUserRecord = (userData: UserMusicData): UserRecord => {
  const topArtist = userData.topArtists && userData.topArtists.length > 0 
    ? userData.topArtists[0].name 
    : "Unknown Artist";
  
  const topGenre = userData.topGenres && userData.topGenres.length > 0 
    ? userData.topGenres[0] 
    : "Unknown Genre";
  
  // Gerar uma seed de alta precisão
  const timestamp = new Date().getTime();
  const randomFactor = Math.random() * 1000000;
  const highPrecisionSeed = parseInt(
    `${timestamp}${Math.floor(randomFactor)}`.substring(0, 16)
  );
  
  return {
    id: userData.userId,
    name: userData.userProfile?.name || "Spotify User",
    timestamp: userData.lastUpdated,
    top_artist: topArtist,
    top_genre: topGenre,
    energy: userData.musicIndex.energy,
    valence: userData.musicIndex.valence,
    danceability: userData.musicIndex.danceability,
    acousticness: userData.musicIndex.acousticness,
    music_score: userData.musicIndex.uniqueScore,
    high_precision_seed: userData.musicIndex.imageSeed || highPrecisionSeed
  };
};

// Exportar dados para JSON (útil para debug ou backup)
export const exportDatabaseToJSON = async (): Promise<UserDatabase> => {
  const records = await getAllUserRecords();
  return { users: records };
};

// Importar dados de JSON (útil para inicialização ou restauração)
export const importJSONToDatabase = async (jsonData: UserDatabase): Promise<boolean> => {
  try {
    if (!jsonData || !jsonData.users || !Array.isArray(jsonData.users)) {
      throw new Error("Formato de dados inválido");
    }
    
    // Limpar o banco de dados e adicionar todos os registros do JSON
    const db = await initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      // Limpar o armazenamento
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Ordenar por timestamp e limitar a 100 registros
        const recordsToImport = jsonData.users
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, MAX_USERS);
        
        let addCounter = 0;
        let success = true;
        
        recordsToImport.forEach((record) => {
          const addRequest = store.add(record);
          
          addRequest.onsuccess = () => {
            addCounter++;
            if (addCounter === recordsToImport.length) {
              resolve(success);
            }
          };
          
          addRequest.onerror = (event) => {
            console.error("Error importing record:", event, record);
            success = false;
            if (addCounter === recordsToImport.length) {
              resolve(success);
            }
          };
        });
      };
      
      clearRequest.onerror = (event) => {
        console.error("Error clearing store:", event);
        reject(false);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Import error:", error);
    return false;
  }
};

// Função para salvar os dados após obter os dados musicais do usuário
export const saveUserMusicDataToDatabase = async (userData: UserMusicData): Promise<boolean> => {
  try {
    // Converter para o formato de registro
    const userRecord = convertToUserRecord(userData);
    
    // Adicionar ao banco de dados
    const success = await addUserRecord(userRecord);
    
    if (success) {
      console.log("User data saved to database successfully");
      toast.success("Seus dados musicais foram salvos com sucesso!");
    } else {
      console.error("Failed to save user data to database");
      toast.error("Erro ao salvar seus dados musicais");
    }
    
    return success;
  } catch (error) {
    console.error("Error saving user data:", error);
    toast.error("Erro ao processar seus dados musicais");
    return false;
  }
};

// Substituir a antiga função que inicializava com dados mock
export const initializeWithMockDataIfEmpty = async (): Promise<void> => {
  try {
    // Apenas verificar se o banco de dados está acessível
    await getAllUserRecords();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

/**
 * Limpar todo o banco de dados
 */
export const clearDatabase = async (): Promise<boolean> => {
  try {
    const db = await initializeDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        console.log("Database cleared successfully");
        resolve(true);
      };
      
      clearRequest.onerror = (event) => {
        console.error("Error clearing database:", event);
        reject(false);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Error clearing database:", error);
    return false;
  }
};
