
import { Button } from "@/components/ui/button";
import { Share, Download, Database, RefreshCw } from "lucide-react";

interface ImageActionButtonsProps {
  onShare: () => void;
  onDownload: () => void;
  onExportDatabase: () => void;
  onRegenerate: () => void;
}

const ImageActionButtons = ({ 
  onShare, 
  onDownload, 
  onExportDatabase, 
  onRegenerate 
}: ImageActionButtonsProps) => {
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="border-gray-200 hover:border-spotify hover:text-spotify transition-all" 
          onClick={onShare}
        >
          <Share className="mr-2 h-4 w-4" />
          Compartilhar
        </Button>
        <Button 
          className="spotify-button" 
          onClick={onDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar
        </Button>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="border-gray-200 hover:border-blue-500 hover:text-blue-500 transition-all"
          onClick={onExportDatabase}
        >
          <Database className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
        
        <Button
          variant="outline"
          className="border-gray-200 hover:border-green-500 hover:text-green-500 transition-all"
          onClick={onRegenerate}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerar
        </Button>
      </div>
    </>
  );
};

export default ImageActionButtons;
