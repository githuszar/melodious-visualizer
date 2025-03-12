
import { Card } from "@/components/ui/card";
import { UserMusicData } from "@/types/spotify";
import { Separator } from "@/components/ui/separator";

interface MusicStatsProps {
  userData: UserMusicData;
}

const MusicStats = ({ userData }: MusicStatsProps) => {
  return (
    <Card className="music-card overflow-hidden max-w-md w-full mx-auto">
      <div className="p-6">
        <div className="mb-4">
          <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1">Music Stats</span>
          <h3 className="mt-2 text-xl font-bold">Your Musical Profile</h3>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Top Artists</h4>
            <div className="space-y-3">
              {userData.topArtists.slice(0, 3).map((artist, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 overflow-hidden rounded-full">
                    <img 
                      src={artist.images[0]?.url || '/placeholder.svg'} 
                      alt={artist.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {artist.genres.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Top Tracks</h4>
            <div className="space-y-3">
              {userData.topTracks.slice(0, 3).map((track, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 overflow-hidden rounded-md">
                    <img 
                      src={track.album.images[0]?.url || '/placeholder.svg'} 
                      alt={track.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{track.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Music Mood</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Energy</p>
                <p className="text-xl font-bold">{Math.round(userData.musicIndex.energy * 100)}%</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Happiness</p>
                <p className="text-xl font-bold">{Math.round(userData.musicIndex.valence * 100)}%</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Danceability</p>
                <p className="text-xl font-bold">{Math.round(userData.musicIndex.danceability * 100)}%</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Acousticness</p>
                <p className="text-xl font-bold">{Math.round(userData.musicIndex.acousticness * 100)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MusicStats;
