
import { useState, useEffect, useCallback } from "react";
import { UserMusicData } from "@/types/spotify";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveGeneratedImage, downloadImage, shareImage } from "@/services/dataStorage";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Music, ExternalLink } from "lucide-react";
import { getAllUserRecords, exportDatabaseToJSON } from "@/services/databaseService";
import ImageVisualizer from "./ImageVisualizer";
import MusicIndexStats from "./MusicIndexStats";
import SocialShareButtons from "./SocialShareButtons";
import ImageActionButtons from "./ImageActionButtons";

interface SpotifyMusicImageProps {
  userData: UserMusicData;
}

const SpotifyMusicImage = ({ userData }: SpotifyMusicImageProps) => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [imageGenerated, setImageGenerated] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [canvasReady, setCanvasReady] = useState<boolean>(false);
  
  // Carregar estatísticas do banco de dados
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
  
  // Função para capturar a imagem do canvas quando estiver pronto
  const captureCanvasImage = useCallback(() => {
    if (!userData?.musicIndex || !canvasReady) {
      console.log("Aguardando canvas ficar pronto ou dados musicais...", {
        musicIndexPresente: !!userData?.musicIndex,
        canvasReady
      });
      return;
    }
    
    if (imageGenerated && imageDataUrl) {
      console.log("Imagem já foi gerada anteriormente, pulando captura");
      return;
    }
    
    console.log("Capturando imagem do canvas com seed:", userData.musicIndex.imageSeed);
    setIsGenerating(true);
    
    // Definir um pequeno atraso para garantir que o canvas foi renderizado completamente
    setTimeout(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        try {
          console.log("Canvas encontrado, dimensões:", canvas.width, canvas.height);
          const dataURL = canvas.toDataURL('image/png');
          
          if (!dataURL || dataURL === 'data:,') {
            throw new Error("Canvas vazio ou inacessível");
          }
          
          setImageDataUrl(dataURL);
          setImageGenerated(true);
          
          // Save to local storage
          saveGeneratedImage(dataURL);
          console.log("Imagem capturada e salva com sucesso");
          
          // Tentar também salvar no disco local via script Python
          tryToSaveLocally(userData.userId, dataURL);
          
          toast.success("Visualização musical gerada com sucesso!");
        } catch (error) {
          console.error("Erro ao capturar imagem do canvas:", error);
          toast.error("Erro ao gerar a imagem. Tente novamente.");
        } finally {
          setIsGenerating(false);
        }
      } else {
        console.error("Canvas não encontrado para captura");
        setIsGenerating(false);
        toast.error("Canvas não encontrado. Tente recarregar a página.");
      }
    }, 1000); // Aumento do tempo para garantir que o canvas está completamente renderizado
  }, [userData?.musicIndex, userData?.userId, canvasReady, imageGenerated, imageDataUrl]);
  
  // Chamar captura quando o canvas estiver pronto
  useEffect(() => {
    if (canvasReady && !imageGenerated && !isGenerating) {
      captureCanvasImage();
    }
  }, [canvasReady, captureCanvasImage, imageGenerated, isGenerating]);
  
  // Função auxiliar para tentar salvar localmente via script Python
  const tryToSaveLocally = (userId: string, imageData: string) => {
    try {
      // Aqui poderíamos implementar uma chamada para o script Python
      console.log("Tentando salvar imagem localmente para usuário:", userId);
      
      // Para fins de demonstração, apenas logamos
      const imageSizeKB = Math.round(imageData.length / 1024);
      console.log(`Imagem capturada (${imageSizeKB}KB) pronta para processamento local`);
      
      // Verificar se estamos em um ambiente que permite integração com Python
      if (window.location.hostname === 'localhost') {
        console.log("Ambiente local detectado, integração com Python é possível");
        // Neste ponto poderíamos fazer uma chamada para um endpoint local
      }
    } catch (error) {
      console.warn("Não foi possível salvar localmente:", error);
    }
  };
  
  const handleCanvasReady = () => {
    console.log("Canvas está pronto para captura");
    setCanvasReady(true);
  };
  
  const handleDownload = () => {
    if (imageDataUrl) {
      const filename = `music-image-${userData.userId}-${Date.now()}.png`;
      downloadImage(imageDataUrl, filename);
      toast.success("Imagem baixada com sucesso!");
    } else {
      toast.error("Imagem não disponível. Tente recarregar a página.");
    }
  };
  
  const handleShare = async () => {
    if (imageDataUrl) {
      try {
        // Tentar compartilhamento nativo primeiro
        if (navigator.share && navigator.canShare) {
          await shareImage(imageDataUrl, "native");
          toast.success("Imagem compartilhada com sucesso!");
        } else {
          // Fallback para compartilhamento social
          const socialSuccess = await shareImage(imageDataUrl, "twitter");
          toast.success("Link para compartilhamento aberto!");
        }
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
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
    setCanvasReady(false);
    setIsGenerating(true);
    
    // Aguardar um momento para a limpeza do estado e então recapturar
    setTimeout(() => {
      toast.success("Imagem sendo regenerada...");
      setIsGenerating(false);
    }, 100);
  };
  
  // Função para compartilhar em redes sociais específicas
  const handleShareSocial = (platform: string) => {
    if (!imageDataUrl) {
      toast.error("Imagem não disponível para compartilhamento");
      return;
    }
    
    const text = `Confira minha visualização musical única! Meu score musical é ${userData.musicIndex.uniqueScore}/100 e meus principais gêneros são ${userData.topGenres.slice(0, 3).join(", ")}.`;
    const url = window.location.href;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      default:
        toast.error("Plataforma de compartilhamento não suportada");
        return;
    }
    
    window.open(shareUrl, '_blank');
    toast.success(`Compartilhando no ${platform}...`);
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
        
        <ImageVisualizer 
          musicIndex={userData.musicIndex} 
          isGenerating={isGenerating}
          imageGenerated={imageGenerated}
          onCanvasReady={handleCanvasReady}
        />
        
        <MusicIndexStats 
          userData={userData}
          totalUsers={totalUsers}
        />
        
        <ImageActionButtons 
          onShare={handleShare}
          onDownload={handleDownload}
          onExportDatabase={handleExportDatabase}
          onRegenerate={handleRegenerateImage}
        />
        
        <SocialShareButtons 
          onShareSocial={handleShareSocial}
        />
        
        {/* Link para diretório de imagens geradas (apenas em ambiente de desenvolvimento) */}
        {window.location.hostname === 'localhost' && (
          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              className="text-xs text-muted-foreground hover:text-spotify"
              onClick={() => window.open('/Users/thiago/Desktop/GitHuszar/YourMusicImge', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver diretório de imagens
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SpotifyMusicImage;
