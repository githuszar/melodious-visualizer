
import { useState, useEffect } from "react";
import { MusicIndex } from "@/types/spotify";
import { RefreshCw } from "lucide-react";
import PerlinCanvas from "./PerlinCanvas";

interface ImageVisualizerProps {
  musicIndex: MusicIndex;
  isGenerating: boolean;
  imageGenerated: boolean;
}

const ImageVisualizer = ({ 
  musicIndex, 
  isGenerating, 
  imageGenerated 
}: ImageVisualizerProps) => {
  return (
    <div className="relative overflow-hidden rounded-xl mb-4">
      {isGenerating ? (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse aspect-square rounded-xl">
          <RefreshCw className="h-12 w-12 text-gray-400 animate-spin" />
        </div>
      ) : musicIndex ? (
        <PerlinCanvas 
          musicIndex={musicIndex} 
          size={400} 
          className="w-full h-full object-cover"
          animated={false} // Desativado animação para garantir consistência
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
