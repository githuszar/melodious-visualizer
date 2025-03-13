
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
          console.log("Usuário está logado, buscando dados em tempo real");
          
          // SEMPRE buscar dados em tempo real ao inicializar a aplicação
          // Isso garante que cada login gere uma nova imagem e obtenha dados atualizados
          await fetchUserData(true);
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
          if (loggedIn) {
            console.log("Usuário logou, buscando dados em tempo real...");
            await fetchUserData(true); // Forçar atualização
          } else {
            // Usuário deslogou, limpar dados
            setUserData(null);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status de login:", error);
      }
    }, 5000); // Verificar a cada 5 segundos para maior responsividade
    
    // Limpar o intervalo quando o componente for desmontado
    return () => {
      clearInterval(loginCheckInterval);
    };
  }, [loginStatus]);
  
  const fetchUserData = async (forceRefresh = true) => {
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
      
      console.log("Fetchando dados em tempo real da API do Spotify");
      // User is logged in, SEMPRE fetch fresh data from Spotify API
      const data = await getRealUserMusicData(forceRefresh);
      console.log("Dados em tempo real obtidos com sucesso da API do Spotify");
      
      // Armazenar timestamp do login atual
      localStorage.setItem("spotify_last_login_time", Date.now().toString());
      
      // Save the data to local storage and database
      saveUserMusicData(data);
      setUserData(data);
      
      toast.success("Dados musicais atualizados em tempo real!");
    } catch (error) {
      console.error("Error fetching user data:", error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : "Falha ao carregar seus dados musicais. Tente novamente.";
      
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      
      // Se temos dados em cache, usá-los apenas como fallback em caso de erro
      if (!forceRefresh) {
        const storedData = getUserMusicData();
        if (storedData) {
          setUserData(storedData);
          toast.info("Usando dados em cache como fallback devido a erro na API.");
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
