
import { useState, useEffect } from "react";
import { MusicIndex } from "@/types/spotify";
import { RefreshCw, AlertCircle } from "lucide-react";
import PerlinCanvas from "./PerlinCanvas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface ImageVisualizerProps {
  musicIndex: MusicIndex;
  isGenerating: boolean;
  imageGenerated: boolean;
  onCanvasReady?: () => void;
}

const ImageVisualizer = ({ 
  musicIndex, 
  isGenerating, 
  imageGenerated,
  onCanvasReady
}: ImageVisualizerProps) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  useEffect(() => {
    // Reset error state when new musicIndex is provided
    if (musicIndex && musicIndex.imageSeed) {
      setHasError(false);
      console.log("Novo índice musical recebido, reset do estado de erro", musicIndex.imageSeed);
    }
  }, [musicIndex, musicIndex.imageSeed]);
  
  const handleCanvasError = () => {
    console.error("Erro ao renderizar o canvas");
    setHasError(true);
    toast.error("Não foi possível gerar a visualização. Tente novamente.");
  };
  
  const handleCanvasReady = () => {
    console.log("Canvas renderizado com sucesso!");
    onCanvasReady?.();
  };
  
  const handleRetry = () => {
    setHasError(false);
    setRetryCount(prev => prev + 1);
    toast.info("Tentando gerar a visualização novamente...");
  };
  
  return (
    <div className="relative overflow-hidden rounded-xl mb-4">
      {isGenerating ? (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse aspect-square rounded-xl">
          <RefreshCw className="h-12 w-12 text-gray-400 animate-spin" />
        </div>
      ) : hasError ? (
        <Alert variant="destructive" className="aspect-square flex flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 mb-2" />
          <AlertDescription className="text-center">
            Não foi possível gerar a visualização.
            <br />
            <button 
              onClick={handleRetry} 
              className="mt-2 text-sm underline"
            >
              Tentar novamente
            </button>
          </AlertDescription>
        </Alert>
      ) : musicIndex ? (
        <PerlinCanvas 
          key={`canvas-${retryCount}-${musicIndex.imageSeed || 'default'}`}
          musicIndex={musicIndex} 
          size={400} 
          className="w-full h-full object-cover"
          animated={false} 
          onError={handleCanvasError}
          onReady={handleCanvasReady}
        />
      ) : (
        <div className="bg-gray-200 dark:bg-gray-800 animate-pulse aspect-square rounded-xl" />
      )}
      
      {/* Indicador de geração */}
      {imageGenerated && (
        <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Gerado em {new Date().toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default ImageVisualizer;
