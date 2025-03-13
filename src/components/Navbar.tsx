
import { Button } from "@/components/ui/button";
import { initiateSpotifyLogin, isLoggedIn, logout } from "@/services/spotify";
import { Music } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Navbar = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  
  useEffect(() => {
    // Verificar status de login quando o componente é montado
    const checkLoginStatus = async () => {
      try {
        const status = await isLoggedIn();
        console.log("Navbar: Status de login:", status);
        setLoggedIn(status);
      } catch (error) {
        console.error("Navbar: Erro ao verificar login:", error);
        setLoggedIn(false);
      }
    };
    
    checkLoginStatus();
    
    // Atualizar status de login quando o localStorage mudar
    const handleStorageChange = async () => {
      try {
        const status = await isLoggedIn();
        console.log("Navbar: Mudança no localStorage, status de login:", status);
        setLoggedIn(status);
      } catch (error) {
        console.error("Navbar: Erro ao verificar login após mudança no storage:", error);
        setLoggedIn(false);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar status de login periodicamente (a cada 15 segundos)
    const intervalId = setInterval(checkLoginStatus, 15000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const handleLogin = () => {
    console.log("Navbar: Iniciando processo de login");
    initiateSpotifyLogin();
  };

  const handleLogout = async () => {
    try {
      console.log("Navbar: Iniciando processo de logout");
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
