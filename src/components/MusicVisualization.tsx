
import { UserMusicData } from "@/types/spotify";
import SpotifyMusicImage from "./SpotifyMusicImage";
import MusicStats from "./MusicStats";
import PageHeader from "./PageHeader";

interface MusicVisualizationProps {
  userData: UserMusicData;
}

const MusicVisualization = ({ userData }: MusicVisualizationProps) => {
  return (
    <div className="container mx-auto">
      <PageHeader />
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="animate-fade-in animate-slide-up">
          <SpotifyMusicImage userData={userData} />
        </div>
        <div className="animate-fade-in animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <MusicStats userData={userData} />
        </div>
      </div>
    </div>
  );
};

export default MusicVisualization;
