
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
    
    // Generate the perlin noise image based on unique user data
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
    
    // Gerar arquivo para o diretório local se os dados estiverem disponíveis
    if (musicIndex && musicIndex.uniqueScore !== undefined) {
      generateLocalImageFile(musicIndex);
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
  
  // Função para gerar arquivo de imagem local
  const generateLocalImageFile = (musicData: MusicIndex) => {
    try {
      // Criar objeto com os dados necessários para o Python
      const data = {
        user_id: `user_${Date.now()}`, // ID único baseado no timestamp
        timestamp: Date.now(),
        music_data: {
          energy: musicData.energy,
          valence: musicData.valence,
          danceability: musicData.danceability,
          acousticness: musicData.acousticness,
          uniqueScore: musicData.uniqueScore,
          timestamp: Date.now()
        }
      };
      
      // Converter para JSON
      const jsonData = JSON.stringify(data, null, 2);
      
      // Tentar salvar no localStorage para debugging
      localStorage.setItem('temp_music_data_for_python', jsonData);
      
      console.log("Dados preparados para processamento Python:", data);
      
      // Tentar fazer uma requisição para um servidor local que pode gerar a imagem
      // Esta parte serviria se houvesse um servidor local rodando
      // Como estamos em ambiente de navegador, isso provavelmente não funcionará
      // mas serve como demonstração da integração
      
      fetch('/api/generate-local-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: jsonData
      }).catch(err => {
        // Silenciar erros porque essa API provavelmente não existe
        console.log("Info: Tentativa de integração com serviço Python local (ignorar erro)");
      });
      
    } catch (error) {
      console.error("Erro ao tentar gerar arquivo de imagem local:", error);
    }
  };
  
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
