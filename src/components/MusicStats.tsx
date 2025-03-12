
import { Card } from "@/components/ui/card";
import { UserMusicData } from "@/types/spotify";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

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
              {userData.topArtists.slice(0, 4).map((artist, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 overflow-hidden rounded-full">
                    <img 
                      src={artist.images[0]?.url || '/placeholder.svg'} 
                      alt={artist.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{artist.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {artist.genres.slice(0, 2).join(', ')}
                      </p>
                      <p className="text-xs font-semibold">
                        Pop: {artist.popularity}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Top Tracks</h4>
            <div className="space-y-3">
              {userData.topTracks.slice(0, 4).map((track, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 overflow-hidden rounded-md">
                    <img 
                      src={track.album.images[0]?.url || '/placeholder.svg'} 
                      alt={track.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{track.name}</p>
                      <p className="text-xs font-semibold">{track.popularity}%</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {track.artists.map(a => a.name).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Genres You Love</h4>
            <div className="flex flex-wrap gap-2">
              {userData.topGenres.slice(0, 8).map((genre, index) => (
                <span 
                  key={index} 
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Music Mood</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Energy</span>
                  <span>{Math.round(userData.musicIndex.energy * 100)}%</span>
                </div>
                <Progress value={userData.musicIndex.energy * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Happiness</span>
                  <span>{Math.round(userData.musicIndex.valence * 100)}%</span>
                </div>
                <Progress value={userData.musicIndex.valence * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Danceability</span>
                  <span>{Math.round(userData.musicIndex.danceability * 100)}%</span>
                </div>
                <Progress value={userData.musicIndex.danceability * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Acousticness</span>
                  <span>{Math.round(userData.musicIndex.acousticness * 100)}%</span>
                </div>
                <Progress value={userData.musicIndex.acousticness * 100} className="h-2" />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Your Unique Music Score</h4>
            <div className="flex items-center">
              <div className="text-3xl font-bold text-spotify mr-3">
                {userData.musicIndex.uniqueScore}
              </div>
              <div className="text-xs text-muted-foreground">
                out of 100 <br />
                <span className="font-medium">
                  {userData.musicIndex.uniqueScore > 80 
                    ? "Exceptionally Unique" 
                    : userData.musicIndex.uniqueScore > 60 
                    ? "Very Distinctive" 
                    : userData.musicIndex.uniqueScore > 40 
                    ? "Moderately Diverse" 
                    : "Fairly Mainstream"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MusicStats;
