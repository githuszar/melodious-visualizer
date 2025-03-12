import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { getUserMusicData } from "@/services/dataStorage";
import { Button } from "@/components/ui/button";
import { UserMusicData } from "@/types/spotify";
import PerlinCanvas from "@/components/PerlinCanvas";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Headphones, Share, Download } from "lucide-react";
import { downloadImage, shareImage } from "@/services/dataStorage";
import { generatePerlinImage } from "@/services/imageGenerator";

const Gallery = () => {
  const [userData, setUserData] = useState<UserMusicData | null>(null);
  const [previewImages, setPreviewImages] = useState<any[]>([]);
  
  useEffect(() => {
    // Get user data from local storage
    const storedData = getUserMusicData();
    setUserData(storedData);
    
    // Generate preview images with variations
    if (storedData && storedData.musicIndex) {
      generatePreviewVariations(storedData.musicIndex);
    }
  }, []);
  
  const generatePreviewVariations = (musicIndex: any) => {
    const variations = [];
    
    // Generate 6 variations with slightly modified parameters
    for (let i = 0; i < 6; i++) {
      const modifiedIndex = {
        ...musicIndex,
        energy: clamp(musicIndex.energy + (Math.random() * 0.4 - 0.2), 0, 1),
        valence: clamp(musicIndex.valence + (Math.random() * 0.4 - 0.2), 0, 1),
        danceability: clamp(musicIndex.danceability + (Math.random() * 0.4 - 0.2), 0, 1),
        uniqueScore: musicIndex.uniqueScore + Math.floor(Math.random() * 10 - 5),
      };
      
      // Add slightly different color schemes to some variations
      if (i > 2) {
        const hueShift = Math.floor(Math.random() * 60 - 30);
        modifiedIndex.colorPalette = musicIndex.colorPalette.map((color: string) => {
          if (color.startsWith('hsl')) {
            const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
              const h = (parseInt(match[1]) + hueShift) % 360;
              return `hsl(${h}, ${match[2]}%, ${match[3]}%)`;
            }
          }
          return color;
        });
      }
      
      // Generate image and data URL
      const { dataURL } = generatePerlinImage(modifiedIndex, 300);
      
      variations.push({
        index: modifiedIndex,
        dataURL,
        name: `Variation ${i + 1}`
      });
    }
    
    setPreviewImages(variations);
  };
  
  const handleDownload = (dataUrl: string, index: number) => {
    downloadImage(dataUrl, `music-variation-${index}.png`);
    toast.success("Image downloaded successfully!");
  };
  
  const handleShare = async (dataUrl: string) => {
    try {
      if (await shareImage(dataUrl, navigator.share ? "native" : "twitter")) {
        toast.success("Image shared successfully!");
      }
    } catch (error) {
      toast.error("Sharing failed. Try downloading instead.");
    }
  };
  
  // Helper function to keep values in range
  const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 container mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-12 animate-fade-in">
          <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1">Gallery</span>
          <h1 className="mt-3 text-4xl font-bold">Your Music Visualization Gallery</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore different variations of your music visualization with unique patterns and color schemes.
          </p>
        </div>
        
        {userData ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewImages.map((image, index) => (
              <div 
                key={index} 
                className="music-card overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative">
                  <img 
                    src={image.dataURL} 
                    alt={`Music Visualization ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-medium bg-black/60 text-white rounded-full px-3 py-1">
                      {image.name}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Score: {image.index.uniqueScore}</p>
                      <p className="text-xs text-muted-foreground">
                        E: {Math.round(image.index.energy * 100)}% | 
                        V: {Math.round(image.index.valence * 100)}%
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="p-1 h-8 w-8"
                        onClick={() => handleShare(image.dataURL)}
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        className="p-1 h-8 w-8 bg-spotify hover:bg-spotify-light"
                        onClick={() => handleDownload(image.dataURL, index)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] max-w-md mx-auto text-center animate-fade-in">
            <div className="glass-panel p-8 w-full">
              <div className="bg-spotify/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Headphones className="h-8 w-8 text-spotify" />
              </div>
              
              <h2 className="text-2xl font-bold mb-3">No Visualizations Yet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your Spotify account to generate your unique music visualizations.
              </p>
              
              <Link to="/">
                <Button className="spotify-button w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>YourMusicImage | Created with ❤️ | Not affiliated with Spotify</p>
        </div>
      </footer>
    </div>
  );
};

export default Gallery;
