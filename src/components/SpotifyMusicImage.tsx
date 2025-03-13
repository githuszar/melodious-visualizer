
import { useState, useEffect, useCallback } from "react";
import { UserMusicData } from "@/types/spotify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveGeneratedImage, downloadImage, shareImage } from "@/services/dataStorage";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import PerlinCanvas from "./PerlinCanvas";
import { Share, Download, Music, Database } from "lucide-react";
import { getAllUserRecords, exportDatabaseToJSON } from "@/services/databaseService";

interface SpotifyMusicImageProps {
  userData: UserMusicData;
}

const SpotifyMusicImage = ({ userData }: SpotifyMusicImageProps) => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [imageGenerated, setImageGenerated] = useState<boolean>(false);
  
  // Função para capturar a imagem do canvas
  const captureCanvasImage = useCallback(() => {
    if (!userData?.musicIndex || imageGenerated) return;
    
    console.log("Capturando imagem do canvas...");
    
    // Definir um pequeno atraso para garantir que o canvas foi renderizado
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        try {
          const dataURL = canvas.toDataURL('image/png');
          setImageDataUrl(dataURL);
          setImageGenerated(true);
          
          // Save to local storage
          saveGeneratedImage(dataURL);
          console.log("Imagem capturada e salva com sucesso");
        } catch (error) {
          console.error("Erro ao capturar imagem do canvas:", error);
        }
      } else {
        console.error("Canvas não encontrado para captura");
      }
    }, 500);
  }, [userData?.musicIndex, imageGenerated]);
  
  useEffect(() => {
    const fetchDatabaseStats = async () => {
      try {
        const records = await getAllUserRecords();
        setTotalUsers(records.length);
      } catch (error) {
        console.error("Error fetching database stats:", error);
      }
    };
    
    fetchDatabaseStats();
  }, []);
  
  useEffect(() => {
    captureCanvasImage();
  }, [captureCanvasImage]);
  
  const handleDownload = () => {
    if (imageDataUrl) {
      downloadImage(imageDataUrl);
      toast.success("Imagem baixada com sucesso!");
    } else {
      toast.error("Imagem não disponível. Tente recarregar a página.");
    }
  };
  
  const handleShare = async () => {
    if (imageDataUrl) {
      try {
        if (await shareImage(imageDataUrl, navigator.share ? "native" : "twitter")) {
          toast.success("Imagem compartilhada com sucesso!");
        }
      } catch (error) {
        toast.error("Falha ao compartilhar. Tente baixar a imagem.");
      }
    } else {
      toast.error("Imagem não disponível para compartilhamento.");
    }
  };
  
  const handleExportDatabase = async () => {
    try {
      const jsonData = await exportDatabaseToJSON();
      const jsonString = JSON.stringify(jsonData, null, 2);
      
      // Criar um blob com os dados JSON
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Criar um link para download
      const link = document.createElement("a");
      link.href = url;
      link.download = "music_database.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Banco de dados exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting database:", error);
      toast.error("Falha ao exportar banco de dados");
    }
  };
  
  // Regenerar a imagem forçando uma nova captura
  const handleRegenerateImage = () => {
    setImageGenerated(false);
    setImageDataUrl(null);
    
    // Aguardar um momento para a limpeza do estado e então recapturar
    setTimeout(() => {
      captureCanvasImage();
      toast.success("Imagem sendo regenerada...");
    }, 100);
  };
  
  return (
    <Card className="music-card overflow-hidden max-w-md w-full mx-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1">Sua Visualização Musical</span>
            <h3 className="mt-2 text-xl font-bold">Impressão Digital Musical Única</h3>
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
        
        <div className="mt-6 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 border-gray-200 hover:border-spotify hover:text-spotify transition-all" 
            onClick={handleShare}
          >
            <Share className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          <Button 
            className="flex-1 spotify-button" 
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar
          </Button>
        </div>
        
        <div className="mt-3 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-gray-200 hover:border-blue-500 hover:text-blue-500 transition-all"
            onClick={handleExportDatabase}
          >
            <Database className="mr-2 h-4 w-4" />
            Exportar Banco
          </Button>
          
          <Button
            variant="outline"
            className="flex-1 border-gray-200 hover:border-green-500 hover:text-green-500 transition-all"
            onClick={handleRegenerateImage}
          >
            <Music className="mr-2 h-4 w-4" />
            Regenerar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SpotifyMusicImage;
