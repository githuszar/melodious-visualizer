
import { Button } from "@/components/ui/button";
import { initiateSpotifyLogin, isLoggedIn, logout } from "@/services/spotifyAuth";
import { Music } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Navbar = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  
  useEffect(() => {
    // Verificar status de login quando o componente é montado
    const checkLoginStatus = async () => {
      const status = await isLoggedIn();
      setLoggedIn(status);
    };
    
    checkLoginStatus();
    
    // Atualizar status de login quando o localStorage mudar
    const handleStorageChange = async () => {
      const status = await isLoggedIn();
      setLoggedIn(status);
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar status de login periodicamente (a cada 30 segundos)
    const intervalId = setInterval(checkLoginStatus, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleLogin = () => {
    // Garantir que quaisquer tokens antigos sejam removidos antes de iniciar novo login
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_token_expiry");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_auth_state");
    localStorage.removeItem("music_user_data");
    localStorage.removeItem("music_image");
    localStorage.removeItem("spotify_user");
    localStorage.removeItem("spotify_last_login_time");
    
    // Limpar também qualquer cookie relacionado ao Spotify
    document.cookie.split(";").forEach(cookie => {
      const [name] = cookie.trim().split("=");
      if (name.includes("spotify")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    
    // Iniciar nova autenticação
    initiateSpotifyLogin();
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLoggedIn(false);
      toast.success("Logout realizado com sucesso. Página será recarregada.");
      
      // Forçar atualização da página após um breve delay para garantir que a UI seja atualizada
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Falha ao fazer logout. Tente novamente.");
    }
  };

  return (
    <header className="navbar-blur fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
        >
          <div className="bg-spotify p-2 rounded-full transition-transform duration-300 group-hover:scale-110">
            <Music className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl">YourMusicImage</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/about" className="text-sm font-medium hover:text-spotify transition-colors">
            About
          </Link>
          
          {loggedIn ? (
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="rounded-full border-gray-300 hover:border-spotify hover:text-spotify transition-all duration-300"
            >
              Logout
            </Button>
          ) : (
            <Button 
              onClick={handleLogin}
              className="spotify-button"
            >
              Connect Spotify
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
