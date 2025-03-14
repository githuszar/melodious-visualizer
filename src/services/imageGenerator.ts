
import { MusicIndex } from "@/types/spotify";

// Enhanced Perlin Noise class with higher precision
class PerlinNoise {
  private gradients: Record<string, [number, number]> = {};
  private memory: Record<string, number> = {};
  
  constructor(private seed = 0) {
    this.seed = seed;
    // Initialize more gradients for higher precision
    for (let i = 0; i < 1024; i++) {
      this.gradients[i] = [
        Math.cos(i * 2.0 * Math.PI / 1024),
        Math.sin(i * 2.0 * Math.PI / 1024)
      ];
    }
  }
  
  private dot([x1, y1]: [number, number], [x2, y2]: [number, number]): number {
    return x1 * x2 + y1 * y2;
  }
  
  private randVec(ix: number, iy: number): [number, number] {
    // Enhanced seed mixing for more randomness
    const a = (ix + iy * 57 + this.seed * 131) % Number.MAX_SAFE_INTEGER;
    const random = (a * (a * a * 15731 + 789221) + 1376312589) & 0x7fffffff;
    return this.gradients[random % 1024];
  }
  
  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  noise(x: number, y: number): number {
    const key = `${x.toFixed(6)},${y.toFixed(6)}`;
    if (this.memory[key] !== undefined) {
      return this.memory[key];
    }
    
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    
    // Get interpolation points
    const x0 = x - ix;
    const y0 = y - iy;
    const x1 = x0 - 1;
    const y1 = y0 - 1;
    
    // Get gradients at the 4 corners
    const g00 = this.randVec(ix, iy);
    const g10 = this.randVec(ix + 1, iy);
    const g01 = this.randVec(ix, iy + 1);
    const g11 = this.randVec(ix + 1, iy + 1);
    
    // Calculate dot products
    const dp00 = this.dot(g00, [x0, y0]);
    const dp10 = this.dot(g10, [x1, y0]);
    const dp01 = this.dot(g01, [x0, y1]);
    const dp11 = this.dot(g11, [x1, y1]);
    
    // Smooth interpolation
    const sx = this.smoothstep(x0);
    const sy = this.smoothstep(y0);
    
    // Interpolate along x
    const nx0 = this.lerp(dp00, dp10, sx);
    const nx1 = this.lerp(dp01, dp11, sx);
    
    // Final value interpolated along y
    const result = this.lerp(nx0, nx1, sy);
    
    // Normalize to [0,1]
    const normalized = (result + 1) / 2;
    
    // Cache the result for performance
    this.memory[key] = normalized;
    
    return normalized;
  }
}

/**
 * Generate a perlin noise image based on music index data
 * Uses high-precision seed for unique image generation
 */
export const generatePerlinImage = (
  musicIndex: MusicIndex,
  size = 500
): { draw: (ctx: CanvasRenderingContext2D) => void; dataURL: string } => {
  // Create an off-screen canvas to generate the image
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  
  // Use high-precision seed if available, otherwise generate one based on music features
  // Ensure we have a consistent seed for the same musical profile
  const highPrecisionSeed = musicIndex.imageSeed || Math.floor(
    (musicIndex.energy * 1000000000) + 
    (musicIndex.valence * 10000000) + 
    (musicIndex.danceability * 100000) + 
    (musicIndex.uniqueScore * 1000) +
    (Date.now() % 100000)  // Add current timestamp to make each login unique
  );
  
  // Generate seed with higher precision using multiple music features
  const seed = Math.abs(Math.sin(highPrecisionSeed * Math.PI)) * 999999999999;
  
  // Create perlin noise generator with the high-precision seed
  const noise = new PerlinNoise(seed);
  
  // Use music features to control visualization parameters
  const scale = 0.005 + (musicIndex.energy * 0.015); // Scale of the noise
  const octaves = 5; // Increased octaves for more detail
  const persistence = 0.4 + (musicIndex.danceability * 0.4); // How much each octave contributes
  const colorMultiplier = musicIndex.valence > 0.5 ? 1.2 : 0.8; // Brighter for high valence
  
  // Use color palette from music index
  const { colorPalette } = musicIndex;
  
  // Function to draw on any canvas context
  const draw = (context: CanvasRenderingContext2D) => {
    // Create a gradient background based on the mood
    const gradient = context.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, colorPalette[0]);
    gradient.addColorStop(0.33, colorPalette[1]);
    gradient.addColorStop(0.66, colorPalette[2]);
    gradient.addColorStop(1, colorPalette[3] || colorPalette[0]);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    // Use noise to create the image
    const imageData = context.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let amplitude = 1;
        let frequency = 1;
        let noiseValue = 0;
        
        // Calculate fractal noise with multiple octaves for more detail
        for (let i = 0; i < octaves; i++) {
          // Use high-precision coordinates
          const sampleX = x * scale * frequency + (seed % 1000) / 10000;
          const sampleY = y * scale * frequency + (seed % 100) / 10000;
          
          noiseValue += noise.noise(sampleX, sampleY) * amplitude;
          
          amplitude *= persistence;
          frequency *= 2;
        }
        
        // Normalize the noise value
        noiseValue = noiseValue / (1 + persistence + persistence*persistence + 
                     persistence*persistence*persistence + persistence*persistence*persistence*persistence);
        
        // Get the pixel index
        const idx = (y * size + x) * 4;
        
        // Use the noise value to modulate the alpha channel
        const alpha = Math.pow(noiseValue, 1.5) * 200 * colorMultiplier;
        
        // Apply the alpha
        data[idx + 3] = Math.min(255, Math.max(0, alpha));
      }
    }
    
    // Add some visual features based on music characteristics
    
    // Add patterns based on energy level
    if (musicIndex.energy > 0.7) {
      // High energy - add dynamic waves or lines
      drawWavePattern(context, size, seed);
    } else if (musicIndex.energy > 0.4) {
      // Medium energy - add grid or dots
      drawGridPattern(context, size, seed);
    } else {
      // Low energy - add subtle dots
      drawDotPattern(context, size, seed);
    }
    
    // Apply effects based on acousticness
    if (musicIndex.acousticness > 0.6) {
      // For acoustic music, add more organic patterns
      context.globalCompositeOperation = "overlay";
      context.globalAlpha = 0.2;
      drawLinePattern(context, size, seed);
      context.globalAlpha = 1.0;
    }
    
    // Reset composite operation
    context.globalCompositeOperation = "source-over";
    
    // Add mood-based visual elements
    if (musicIndex.valence > 0.7) {
      // Happy/upbeat music gets bright accents
      for (let i = 0; i < 5; i++) {
        const cx = size * ((seed + i * 100) % 1000) / 1000;
        const cy = size * ((seed + i * 200) % 1000) / 1000;
        const radius = size * (0.05 + musicIndex.energy * 0.08);
        
        context.globalCompositeOperation = "lighter";
        const gradientCircle = context.createRadialGradient(
          cx, cy, 0,
          cx, cy, radius
        );
        gradientCircle.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        gradientCircle.addColorStop(1, "transparent");
        
        context.fillStyle = gradientCircle;
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    
    // Apply the modified pixels back to the canvas
    context.putImageData(imageData, 0, 0);
    
    // Adicionar texto com o score musical
    context.font = "bold 18px Arial";
    context.fillStyle = "white";
    context.globalAlpha = 0.9;
    context.textAlign = "center";
    context.fillText(`Score Musical: ${musicIndex.uniqueScore}/100`, size / 2, size - 20);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    context.font = "12px Arial";
    context.globalAlpha = 0.7;
    context.fillText(`Gerado em: ${dateStr}`, size / 2, size - 40);
    
    // Restaurar alpha
    context.globalAlpha = 1.0;
    
    // Salvar dados para o script Python local
    try {
      // Criar e salvar os dados como JSON no localStorage
      // Servirá como ponte para o script Python caso o usuário queira exportar
      const musicData = {
        userId: localStorage.getItem('spotify_user_id') || 'unknown_user',
        timestamp: Date.now(),
        seed: seed,
        musicScore: musicIndex.uniqueScore,
        features: {
          energy: musicIndex.energy,
          valence: musicIndex.valence,
          danceability: musicIndex.danceability,
          acousticness: musicIndex.acousticness,
        }
      };
      
      localStorage.setItem('music_image_data', JSON.stringify(musicData));
      console.log("Dados da imagem salvos para possível exportação:", musicData);
    } catch (error) {
      console.error("Erro ao salvar dados da imagem:", error);
    }
  };
  
  // Helper pattern functions
  function drawLinePattern(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    const lineCount = 5 + (seed % 10);
    const spacing = size / lineCount;
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    
    for (let i = 0; i < lineCount; i++) {
      ctx.beginPath();
      if ((seed + i) % 2 === 0) {
        // Horizontal lines
        ctx.moveTo(0, i * spacing);
        ctx.lineTo(size, i * spacing);
      } else {
        // Vertical lines
        ctx.moveTo(i * spacing, 0);
        ctx.lineTo(i * spacing, size);
      }
      ctx.stroke();
    }
  }
  
  function drawDotPattern(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    const dotCount = 50 + (seed % 50);
    
    for (let i = 0; i < dotCount; i++) {
      const x = ((seed + i * 100) % 1000) / 1000 * size;
      const y = ((seed + i * 200) % 1000) / 1000 * size;
      const radius = 1 + ((seed + i) % 3);
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    }
  }
  
  function drawWavePattern(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    const waveCount = 3 + (seed % 5);
    const amplitude = size / 20;
    const frequency = 10 + (seed % 10);
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    
    for (let w = 0; w < waveCount; w++) {
      const yOffset = (size / (waveCount + 1)) * (w + 1);
      
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      
      for (let x = 0; x < size; x += 5) {
        const y = yOffset + Math.sin(x / frequency + seed / 10000 + w) * amplitude;
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    }
  }
  
  function drawGridPattern(ctx: CanvasRenderingContext2D, size: number, seed: number) {
    const gridSize = 20 + (seed % 30);
    const rows = Math.floor(size / gridSize);
    const cols = Math.floor(size / gridSize);
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        // Only draw some cells based on seed
        if (((i * j + seed) % 4) === 0) {
          const x = j * gridSize;
          const y = i * gridSize;
          
          ctx.strokeRect(x, y, gridSize, gridSize);
        }
      }
    }
  }
  
  // Draw on the off-screen canvas
  draw(ctx);
  
  // Return both the drawing function and the dataURL
  return {
    draw,
    dataURL: canvas.toDataURL("image/png")
  };
};

/**
 * Generate an image based on music data
 */
export const getMockMusicImage = (musicIndex: MusicIndex, size = 500) => {
  return generatePerlinImage(musicIndex, size);
};

/**
 * Gerar um arquivo local de imagem se possível
 * Esse método tenta salvar a imagem no diretório do usuário via localStorage
 */
export const saveImageToLocalFile = (musicIndex: MusicIndex): boolean => {
  try {
    // Criar os dados para serem salvos no arquivo temp JSON
    const data = {
      user_id: localStorage.getItem('spotify_user_id') || `user_${Date.now()}`,
      timestamp: Date.now(),
      music_data: {
        energy: musicIndex.energy,
        valence: musicIndex.valence,
        danceability: musicIndex.danceability,
        acousticness: musicIndex.acousticness,
        uniqueScore: musicIndex.uniqueScore
      }
    };
    
    // Salvar no localStorage para debugging ou para um possível servidor local pegar
    localStorage.setItem('temp_music_data', JSON.stringify(data));
    
    console.log("Dados de imagem preparados para armazenamento local:", data);
    return true;
  } catch (error) {
    console.error("Erro ao tentar salvar imagem localmente:", error);
    return false;
  }
};
