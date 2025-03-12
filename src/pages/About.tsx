
import Navbar from "@/components/Navbar";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { MusicIcon } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 container mx-auto max-w-3xl">
        <div className="glass-panel p-8 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-spotify p-3 rounded-full">
              <MusicIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">About YourMusicImage</h1>
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-6 text-lg">
            <p>
              YourMusicImage is an innovative web application that transforms your musical taste into a unique visual art piece. Using advanced algorithms and data from your Spotify listening history, we create stunning abstract visualizations that represent your musical identity.
            </p>
            
            <h2 className="text-2xl font-bold mt-8">How It Works</h2>
            <p>
              Our application analyzes various aspects of your music preferences including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your most listened to artists and tracks</li>
              <li>The genres you engage with most frequently</li>
              <li>Audio characteristics like energy, valence (happiness), and acousticness</li>
              <li>The overall uniqueness of your music taste</li>
            </ul>
            
            <p>
              We then use these data points to generate parameters for our Perlin noise algorithm, which creates beautiful, flowing abstract patterns unique to your musical profile. The colors, shapes, and intensities in your visualization directly correlate to different aspects of your listening habits.
            </p>
            
            <h2 className="text-2xl font-bold mt-8">Privacy & Data Usage</h2>
            <p>
              We take your privacy seriously. YourMusicImage only requests access to your Spotify listening data to generate your visualization. We don't permanently store your data on our servers - all processing happens locally in your browser.
            </p>
            
            <h2 className="text-2xl font-bold mt-8">Get Started</h2>
            <p>
              Ready to see your music taste transformed into art? Head to our <Link to="/" className="text-spotify hover:underline">home page</Link> and connect your Spotify account to generate your unique musical visualization.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>YourMusicImage | Created with ❤️ | Not affiliated with Spotify</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
