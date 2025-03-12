
import { MusicIndex } from "@/types/spotify";

// Class to generate perlin noise
class PerlinNoise {
  private gradients: Record<string, [number, number]> = {};
  private memory: Record<string, number> = {};
  
  constructor(private seed = 0) {
    this.seed = seed;
    // Initialize gradients
    for (let i = 0; i < 256; i++) {
      this.gradients[i] = [
        Math.cos(i * 2.0 * Math.PI / 256),
        Math.sin(i * 2.0 * Math.PI / 256)
      ];
    }
  }
  
  private dot([x1, y1]: [number, number], [x2, y2]: [number, number]): number {
    return x1 * x2 + y1 * y2;
  }
  
  private randVec(ix: number, iy: number): [number, number] {
    // The seed controls randomness
    const a = ix + iy * 57 + this.seed * 131;
    const random = (a * (a * a * 15731 + 789221) + 1376312589) & 0x7fffffff;
    return this.gradients[random % 256];
  }
  
  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }
  
  noise(x: number, y: number): number {
    const key = `${x},${y}`;
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
    
    // Cache the result
    this.memory[key] = normalized;
    
    return normalized;
  }
}

/**
 * Generate a perlin noise image based on music index data
 * Returns an object with the canvas drawing function and dataURL
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
  
  // Generate a seed based on the music index
  const seed = Math.floor(
    (musicIndex.energy * 1000) + 
    (musicIndex.valence * 100) + 
    (musicIndex.danceability * 10) + 
    (musicIndex.uniqueScore)
  );
  
  // Create perlin noise generator with the seed
  const noise = new PerlinNoise(seed);
  
  // Use music features to control visualization parameters
  const scale = 0.005 + (musicIndex.energy * 0.015); // Scale of the noise
  const octaves = 4; // Number of octaves for fractal noise
  const persistence = 0.4 + (musicIndex.danceability * 0.4); // How much each octave contributes
  const colorMultiplier = musicIndex.valence > 0.5 ? 1.2 : 0.8; // Brighter for high valence
  
  // Extract colors from the music index
  const { colorPalette } = musicIndex;
  
  // Clear the canvas
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, size, size);
  
  // Function to draw on any canvas context
  const draw = (context: CanvasRenderingContext2D) => {
    // Draw gradient background
    const gradient = context.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, colorPalette[0]);
    gradient.addColorStop(0.33, colorPalette[1]);
    gradient.addColorStop(0.66, colorPalette[2]);
    gradient.addColorStop(1, colorPalette[3]);
    
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
        
        // Calculate fractal noise with multiple octaves
        for (let i = 0; i < octaves; i++) {
          const sampleX = x * scale * frequency;
          const sampleY = y * scale * frequency;
          
          noiseValue += noise.noise(sampleX, sampleY) * amplitude;
          
          amplitude *= persistence;
          frequency *= 2;
        }
        
        // Normalize the noise value
        noiseValue = noiseValue / (1 + persistence + persistence*persistence + persistence*persistence*persistence);
        
        // Get the pixel index
        const idx = (y * size + x) * 4;
        
        // Use the noise value to modulate the alpha channel
        const alpha = Math.pow(noiseValue, 1.5) * 200 * colorMultiplier;
        
        // Apply the alpha
        data[idx + 3] = Math.min(255, Math.max(0, alpha));
      }
    }
    
    // Add some visual features based on music qualities
    if (musicIndex.energy > 0.6) {
      // Add energy bursts for high energy music
      for (let i = 0; i < 5; i++) {
        const cx = size * (0.3 + Math.random() * 0.4);
        const cy = size * (0.3 + Math.random() * 0.4);
        const radius = size * (0.1 + musicIndex.energy * 0.2);
        
        const burstGradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
        burstGradient.addColorStop(0, `${colorPalette[i % colorPalette.length]}CC`);
        burstGradient.addColorStop(1, "transparent");
        
        context.globalCompositeOperation = "screen";
        context.fillStyle = burstGradient;
        context.beginPath();
        context.arc(cx, cy, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    
    if (musicIndex.valence < 0.4) {
      // Add some dark vignette for low valence (sad) music
      const vignetteGradient = context.createRadialGradient(
        size/2, size/2, size*0.25, 
        size/2, size/2, size*0.7
      );
      vignetteGradient.addColorStop(0, "transparent");
      vignetteGradient.addColorStop(1, "rgba(0,0,0,0.7)");
      
      context.globalCompositeOperation = "multiply";
      context.fillStyle = vignetteGradient;
      context.fillRect(0, 0, size, size);
    }
    
    // Reset composite operation
    context.globalCompositeOperation = "source-over";
    
    // Apply the modified pixels back to the canvas
    context.putImageData(imageData, 0, 0);
  };
  
  // Draw on the off-screen canvas
  draw(ctx);
  
  // Return both the drawing function and the dataURL
  return {
    draw,
    dataURL: canvas.toDataURL("image/png")
  };
};

/**
 * Mock function to generate an image based on music data
 * In a real app, this would be replaced by actual generation logic
 */
export const getMockMusicImage = (musicIndex: MusicIndex, size = 500) => {
  return generatePerlinImage(musicIndex, size);
};
