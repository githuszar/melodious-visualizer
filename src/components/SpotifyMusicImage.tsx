
import { useState, useEffect } from "react";
import { UserMusicData } from "@/types/spotify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveGeneratedImage, downloadImage, shareImage } from "@/services/dataStorage";
import { getMockMusicImage } from "@/services/imageGenerator";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import PerlinCanvas from "./PerlinCanvas";
import { Share, Download, Music } from "lucide-react";

interface SpotifyMusicImageProps {
  userData: UserMusicData;
}

const SpotifyMusicImage = ({ userData }: SpotifyMusicImageProps) => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (userData && userData.musicIndex) {
      // Generate the image
      const { dataURL } = getMockMusicImage(userData.musicIndex);
      setImageDataUrl(dataURL);
      
      // Save to local storage
      saveGeneratedImage(dataURL);
    }
  }, [userData]);
  
  const handleDownload = () => {
    if (imageDataUrl) {
      downloadImage(imageDataUrl);
      toast.success("Image downloaded successfully!");
    }
  };
  
  const handleShare = async () => {
    if (imageDataUrl) {
      try {
        if (await shareImage(imageDataUrl, navigator.share ? "native" : "twitter")) {
          toast.success("Image shared successfully!");
        }
      } catch (error) {
        toast.error("Sharing failed. Try downloading instead.");
      }
    }
  };
  
  return (
    <Card className="music-card overflow-hidden max-w-md w-full mx-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1">Your Music Visualization</span>
            <h3 className="mt-2 text-xl font-bold">Unique Musical Fingerprint</h3>
          </div>
          <div className="bg-spotify p-2 rounded-full">
            <Music className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="relative overflow-hidden rounded-xl mb-4">
          {userData.musicIndex ? (
            <PerlinCanvas 
              musicIndex={userData.musicIndex} 
              size={400} 
              className="w-full h-full object-cover animate-pulse-slow"
              animated={true}
            />
          ) : (
            <div className="bg-gray-200 dark:bg-gray-800 animate-pulse aspect-square rounded-xl" />
          )}
        </div>
        
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Music Score</span>
            <span className="text-lg font-bold">{userData.musicIndex.uniqueScore}/100</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Primary Genres</span>
            <div className="flex flex-wrap justify-end gap-1">
              {userData.topGenres.slice(0, 3).map((genre, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Energy Level</span>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-spotify" 
                style={{ width: `${userData.musicIndex.energy * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mood</span>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${userData.musicIndex.valence * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 border-gray-200 hover:border-spotify hover:text-spotify transition-all" 
            onClick={handleShare}
          >
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button 
            className="flex-1 spotify-button" 
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SpotifyMusicImage;
