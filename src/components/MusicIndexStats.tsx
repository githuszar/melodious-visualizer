
import { UserMusicData } from "@/types/spotify";

interface MusicIndexStatsProps {
  userData: UserMusicData;
  totalUsers: number;
}

const MusicIndexStats = ({ userData, totalUsers }: MusicIndexStatsProps) => {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Score Musical</span>
        <span className="text-lg font-bold">{userData.musicIndex.uniqueScore}/100</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Gêneros Principais</span>
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
        <span className="text-sm font-medium">Nível de Energia</span>
        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-spotify" 
            style={{ width: `${userData.musicIndex.energy * 100}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Humor</span>
        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${userData.musicIndex.valence * 100}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Registros no Banco</span>
        <span className="text-sm">{totalUsers} usuários</span>
      </div>
    </div>
  );
};

export default MusicIndexStats;
