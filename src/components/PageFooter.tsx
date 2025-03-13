
import { Heart } from "lucide-react";

const PageFooter = () => {
  return (
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
  );
};

export default PageFooter;
