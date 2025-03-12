
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
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Generate the perlin noise image
    const { draw } = generatePerlinImage(musicIndex, size);
    
    // Draw the initial image
    draw(ctx);
    
    // If animated, add subtle animation
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
  
  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className={`rounded-xl ${className}`}
    />
  );
};

export default PerlinCanvas;
