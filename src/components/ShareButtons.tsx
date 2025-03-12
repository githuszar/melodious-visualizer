
import { Button } from "@/components/ui/button";
import { saveImageLocally, downloadImage } from "@/services/fileService";
import { shareImage } from "@/services/dataStorage";
import { toast } from "sonner";
import { Download, Share2, Save } from "lucide-react";

interface ShareButtonsProps {
  imageData: string;
  userId: string;
}

const ShareButtons = ({ imageData, userId }: ShareButtonsProps) => {
  const handleSaveLocally = async () => {
    const success = await saveImageLocally(imageData, userId);
    if (success) {
      toast.success("Imagem salva com sucesso!");
    } else {
      toast.error("Falha ao salvar imagem. Tente baixar manualmente.");
    }
  };

  const handleDownload = () => {
    downloadImage(imageData, `music-image-${userId}.png`);
    toast.success("Download iniciado!");
  };

  const handleShare = async () => {
    const success = await shareImage(imageData, "native");
    if (success) {
      toast.success("Compartilhado com sucesso!");
    } else {
      // Tente compartilhar no Twitter como fallback
      const twitterSuccess = await shareImage(imageData, "twitter");
      if (twitterSuccess) {
        toast.success("Compartilhado no Twitter!");
      } else {
        toast.error("Falha ao compartilhar. Tente novamente mais tarde.");
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4 justify-center">
      <Button 
        variant="outline" 
        className="rounded-full border-gray-300 hover:border-spotify hover:text-spotify"
        onClick={handleSaveLocally}
      >
        <Save className="mr-2 h-4 w-4" />
        Salvar
      </Button>
      
      <Button 
        variant="outline" 
        className="rounded-full border-gray-300 hover:border-spotify hover:text-spotify"
        onClick={handleDownload}
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
      
      <Button 
        variant="outline" 
        className="rounded-full border-gray-300 hover:border-spotify hover:text-spotify"
        onClick={handleShare}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Compartilhar
      </Button>
    </div>
  );
};

export default ShareButtons;
