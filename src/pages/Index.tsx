
import { useEffect, useState } from "react";
import { UserMusicData } from "@/types/spotify";
import { handleSpotifyCallback, isLoggedIn } from "@/services/spotifyAuth";
import { getMockUserMusicData } from "@/services/spotifyApi";
import { getUserMusicData, saveUserMusicData } from "@/services/dataStorage";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SpotifyMusicImage from "@/components/SpotifyMusicImage";
import MusicStats from "@/components/MusicStats";
import { Music, Headphones } from "lucide-react";
import { initiateSpotifyLogin } from "@/services/spotifyAuth";
import { toast } from "sonner";

const Index = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserMusicData | null>(null);
  
  useEffect(() => {
    const initializeApp = async () => {
      // Check if this is a callback from Spotify auth
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      
      if (code) {
        const success = await handleSpotifyCallback();
        if (success) {
          fetchUserData();
        } else {
          setIsLoading(false);
        }
        return;
      }
      
      // Check if we have data in local storage
      const storedData = getUserMusicData();
      if (storedData) {
        setUserData(storedData);
        setIsLoading(false);
        return;
      }
      
      // Check if user is logged in
      if (isLoggedIn()) {
        fetchUserData();
      } else {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);
  
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // In a real app, we would fetch the actual data from Spotify API
      // For the MVP demo, we use mock data
      const data = await getMockUserMusicData();
      
      // Save the data to local storage
      saveUserMusicData(data);
      setUserData(data);
      
      toast.success("Successfully retrieved your music data!");
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load your music data. Please try again.");
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
            <p className="mt-4 text-lg">Loading your music profile...</p>
          </div>
        ) : userData ? (
          <div className="container mx-auto">
            <div className="mx-auto max-w-4xl text-center mb-12 animate-fade-in">
              <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1">Your Music Identity</span>
              <h1 className="mt-3 text-4xl font-bold">Your Unique Music Visualization</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Based on your Spotify listening history, we've created a unique audio fingerprint visualization just for you.
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
              
              <h1 className="text-3xl font-bold mb-3">Visualize Your Music Taste</h1>
              <p className="text-muted-foreground mb-8">
                Connect your Spotify account to generate a unique visual representation of your music taste and preferences.
              </p>
              
              <Button 
                onClick={initiateSpotifyLogin}
                className="spotify-button w-full"
              >
                <Music className="mr-2 h-5 w-5" />
                Connect with Spotify
              </Button>
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

export default Index;
