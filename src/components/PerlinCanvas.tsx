
import { useEffect, useRef } from "react";
import { MusicIndex } from "@/types/spotify";
import { generatePerlinImage } from "@/services/imageGenerator";

interface PerlinCanvasProps {
  musicIndex: MusicIndex;
  size?: number;
  className?: string;
  animated?: boolean;
}

const PerlinCanvas = ({ 
  musicIndex, 
  size = 500, 
  className = "",
  animated = false
}: PerlinCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const hasDrawnRef = useRef<boolean>(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Evitar redesenhar se já foi desenhado (para consistência)
    if (hasDrawnRef.current && !animated) {
      console.log("Canvas já renderizado, pulando para manter consistência");
      return;
    }
    
    // Limpar qualquer animação anterior
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    console.log(`Gerando imagem com seed: ${musicIndex.imageSeed || 'N/A'}`);
    
    // Generate the perlin noise image
    const { draw } = generatePerlinImage(musicIndex, size);
    
    // Draw the initial image
    draw(ctx);
    hasDrawnRef.current = true;
    
    // Se animated for true, adicione animação sutil
    if (animated) {
      let offset = 0;
      
      const animate = () => {
        offset += 0.002;
        
        // Create a new modified music index with subtle variations over time
        const animatedIndex = {
          ...musicIndex,
          energy: musicIndex.energy + Math.sin(offset) * 0.05,
          valence: musicIndex.valence + Math.cos(offset * 0.7) * 0.05
        };
        
        // Generate and draw the animated image
        const { draw: animatedDraw } = generatePerlinImage(animatedIndex, size);
        animatedDraw(ctx);
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [musicIndex, size, animated]);
  
  // Forçar re-render quando o seed mudar significativamente
  useEffect(() => {
    hasDrawnRef.current = false;
  }, [musicIndex.imageSeed]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className={`rounded-xl ${className}`}
      data-seed={musicIndex.imageSeed}
    />
  );
};

export default PerlinCanvas;
