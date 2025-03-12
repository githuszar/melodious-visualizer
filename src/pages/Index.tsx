import { useEffect, useState } from "react";
import { UserMusicData } from "@/types/spotify";
import { isLoggedIn } from "@/services/spotifyAuth";
import { getRealUserMusicData } from "@/services/spotifyApi";
import { getUserMusicData, saveUserMusicData, initializeDatabase, clearStoredData } from "@/services/dataStorage";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SpotifyMusicImage from "@/components/SpotifyMusicImage";
import MusicStats from "@/components/MusicStats";
import { Music, Headphones, Heart, User } from "lucide-react";
import { initiateSpotifyLogin } from "@/services/spotifyAuth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Index = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserMusicData | null>(null);
  const [loginStatus, setLoginStatus] = useState<boolean>(false);
  
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
  }, [loginStatus]);
  
  const fetchUserData = async (forceRefresh = false) => {
    setIsLoading(true);
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
      toast.error("Falha ao carregar seus dados musicais. Tente novamente.");
      
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
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <div className="relative w-16 h-16 animate-spin">
              <Music className="w-full h-full text-spotify" />
            </div>
            <p className="mt-4 text-lg">Carregando seu perfil musical...</p>
          </div>
        ) : userData ? (
          <div className="container mx-auto">
            {userData.userProfile && (
              <Card className="mb-8 max-w-4xl mx-auto">
                <CardHeader className="pb-2">
                  <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1 w-fit">Perfil do Usuário</span>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {userData.userProfile.image ? (
                        <AvatarImage src={userData.userProfile.image} alt={userData.userProfile.name} />
                      ) : (
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{userData.userProfile.name}</h2>
                      <p className="text-muted-foreground">{userData.userProfile.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="mx-auto max-w-4xl text-center mb-12 animate-fade-in">
              <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1">Sua Identidade Musical</span>
              <h1 className="mt-3 text-4xl font-bold">Sua Visualização Musical Única</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Baseado no seu histórico de audição do Spotify, criamos uma visualização única de impressão digital de áudio apenas para você.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="animate-fade-in animate-slide-up">
                <SpotifyMusicImage userData={userData} />
              </div>
              <div className="animate-fade-in animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <MusicStats userData={userData} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[80vh] max-w-md mx-auto text-center animate-fade-in">
            <div className="glass-panel p-8 w-full">
              <div className="bg-spotify/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Headphones className="h-10 w-10 text-spotify" />
              </div>
              
              <h1 className="text-3xl font-bold mb-3">Visualize Seu Gosto Musical</h1>
              <p className="text-muted-foreground mb-8">
                Conecte sua conta do Spotify para gerar uma representação visual única do seu gosto e preferências musicais.
              </p>
              
              <Button 
                onClick={initiateSpotifyLogin}
                className="spotify-button w-full"
              >
                <Music className="mr-2 h-5 w-5" />
                Conectar com Spotify
              </Button>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center text-sm text-muted-foreground gap-1">
            <p>Dados fornecidos pelo Spotify</p>
            <img src="https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png" alt="Spotify Logo" className="h-4 ml-1" />
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <p>
              YourMusicImage | Criado com <Heart className="inline-block h-3 w-3 text-red-500 mx-1" fill="currentColor" /> pelo Time Melodious Visualizer
            </p>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            <p>Este site não é afiliado ao Spotify. Spotify é uma marca registrada da Spotify AB.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
