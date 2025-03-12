
import { Button } from "@/components/ui/button";
import { initiateSpotifyLogin, isLoggedIn, logout } from "@/services/spotifyAuth";
import { Music } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  
  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
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
          <Link to="/gallery" className="text-sm font-medium hover:text-spotify transition-colors">
            Gallery
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
              onClick={initiateSpotifyLogin}
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
