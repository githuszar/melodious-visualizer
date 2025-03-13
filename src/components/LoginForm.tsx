
import { Button } from "@/components/ui/button";
import { initiateSpotifyLogin } from "@/services/spotifyAuth";
import { Headphones, Music } from "lucide-react";

const LoginForm = () => {
  return (
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
  );
};

export default LoginForm;
