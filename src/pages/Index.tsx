
import { useEffect, useState } from "react";
import { UserMusicData } from "@/types/spotify";
import { isLoggedIn } from "@/services/spotify";
import { getRealUserMusicData } from "@/services/spotifyApi";
import { getUserMusicData, saveUserMusicData, initializeDatabase, clearStoredData } from "@/services/dataStorage";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import UserProfile from "@/components/UserProfile";
import LoginForm from "@/components/LoginForm";
import MusicVisualization from "@/components/MusicVisualization";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageFooter from "@/components/PageFooter";

const Index = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserMusicData | null>(null);
  const [loginStatus, setLoginStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      console.log("Inicializando aplicação...");
      // Inicializar o banco de dados
      await initializeDatabase();
      
      // Check if user is logged in
      try {
        const loggedIn = await isLoggedIn();
        console.log("Status de login:", loggedIn);
        setLoginStatus(loggedIn);
        
        if (loggedIn) {
          console.log("Usuário está logado, verificando dados");
          
          // Verificar timestamp do último login para decidir se precisa atualizar dados
          const lastLoginTime = localStorage.getItem("spotify_last_login_time");
          const currentTime = Date.now();
          const ONE_HOUR = 60 * 60 * 1000; // 1 hora em milissegundos
          
          // Se não há registro de último login ou se passou mais de 1 hora, busca dados novos
          if (!lastLoginTime || (currentTime - parseInt(lastLoginTime)) > ONE_HOUR) {
            console.log("Buscando dados frescos (último login expirado ou inexistente)");
            await fetchUserData(true);
          } else {
            // Tentar usar dados em cache primeiro, mas se falhar, buscar novos
            const cachedData = getUserMusicData();
            if (cachedData) {
              console.log("Usando dados em cache (login recente)");
              setUserData(cachedData);
              setIsLoading(false);
            } else {
              console.log("Cache vazio, buscando dados novos");
              await fetchUserData(true);
            }
          }
        } else {
          console.log("Usuário não está logado");
          // Garantir que não existam dados de usuário no estado
          setUserData(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erro ao verificar login:", error);
        setIsLoading(false);
        setUserData(null); // Resetar dados em caso de erro
        setErrorMessage("Não foi possível verificar seu status de login. Por favor, tente novamente.");
        toast.error("Erro ao verificar login. Por favor, recarregue a página.");
      }
    };
    
    initializeApp();
    
    // Verificar status de login periodicamente
    const loginCheckInterval = setInterval(async () => {
      try {
        const loggedIn = await isLoggedIn();
        if (loggedIn !== loginStatus) {
          console.log("Status de login alterado:", loggedIn);
          setLoginStatus(loggedIn);
          if (loggedIn && !userData) {
            console.log("Usuário logado, mas sem dados. Buscando dados...");
            await fetchUserData(true);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status de login:", error);
      }
    }, 10000); // Verificar a cada 10 segundos
    
    // Limpar o intervalo quando o componente for desmontado
    return () => {
      clearInterval(loginCheckInterval);
    };
  }, [loginStatus, userData]);
  
  const fetchUserData = async (forceRefresh = false) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        console.log("Usuário não está logado, não é possível buscar dados");
        setIsLoading(false);
        setUserData(null);
        return;
      }
      
      console.log("Fetchando dados reais do usuário da API do Spotify");
      // User is logged in, fetch real data from Spotify API
      const data = await getRealUserMusicData();
      console.log("Dados obtidos com sucesso da API do Spotify");
      
      // Armazenar timestamp do login atual
      localStorage.setItem("spotify_last_login_time", Date.now().toString());
      
      // Save the data to local storage and database
      saveUserMusicData(data);
      setUserData(data);
      
      toast.success("Dados musicais obtidos com sucesso!");
    } catch (error) {
      console.error("Error fetching user data:", error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : "Falha ao carregar seus dados musicais. Tente novamente.";
      
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      
      // Check if we have any data in storage as fallback
      if (!forceRefresh) {
        const storedData = getUserMusicData();
        if (storedData) {
          setUserData(storedData);
          toast.info("Usando dados em cache.");
        } else {
          // Se não temos dados no cache, resetar o estado
          setUserData(null);
        }
      } else {
        // Se estamos forçando atualização, não devemos usar cache
        console.log("Ignorando dados em cache pois estamos forçando atualização");
        setUserData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        {isLoading ? (
          <LoadingSpinner />
        ) : userData ? (
          <>
            {userData.userProfile && <UserProfile userProfile={userData.userProfile} />}
            <MusicVisualization userData={userData} />
          </>
        ) : (
          // Pass props using spreading to avoid TypeScript errors
          <LoginForm {...(errorMessage ? { errorMessage } : {})} />
        )}
      </main>
      
      <PageFooter />
    </div>
  );
};

export default Index;
