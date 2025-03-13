
import { SpotifyArtist, AudioFeatures, MusicIndex } from "@/types/spotify";

/**
 * Calculate the most common genres from user's top artists
 */
export const extractTopGenres = (artists: SpotifyArtist[]): string[] => {
  const genreCounts: Record<string, number> = {};
  
  artists.forEach(artist => {
    artist.genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });
  
  // Sort genres by count and return top ones
  return Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);
};

/**
 * Calculate music index from audio features with enhanced uniqueness
 * Now uses login timestamp to ensure uniqueness for each session
 */
export const calculateMusicIndex = (
  audioFeatures: AudioFeatures[], 
  topGenres: string[],
  userData: { id: string, timestamp?: number } = { id: '', timestamp: Date.now() }
): MusicIndex => {
  // Calculate average audio features
  const avgEnergy = audioFeatures.reduce((sum, feat) => sum + feat.energy, 0) / audioFeatures.length || 0.5;
  const avgValence = audioFeatures.reduce((sum, feat) => sum + feat.valence, 0) / audioFeatures.length || 0.5;
  const avgDanceability = audioFeatures.reduce((sum, feat) => sum + feat.danceability, 0) / audioFeatures.length || 0.5;
  const avgAcousticness = audioFeatures.reduce((sum, feat) => sum + feat.acousticness, 0) / audioFeatures.length || 0.3;
  const avgTempos = audioFeatures.reduce((sum, feat) => sum + feat.tempo, 0) / audioFeatures.length || 120;
  
  // Generate color palette based on audio features
  const colorPalette = [
    // Energy color (red to blue spectrum)
    `hsl(${Math.floor(240 - (avgEnergy * 240))}, 80%, ${Math.floor(40 + avgValence * 30)}%)`,
    // Valence color (yellow to purple spectrum)
    `hsl(${Math.floor(60 + (160 * (1 - avgValence)))}, 80%, ${Math.floor(45 + avgEnergy * 25)}%)`,
    // Dance color (green to pink spectrum)
    `hsl(${Math.floor(120 + (300 * avgDanceability) % 360)}, 70%, ${Math.floor(50 + avgValence * 20)}%)`,
    // Acousticness color (brown to cyan spectrum)
    `hsl(${Math.floor(30 + (150 * avgAcousticness))}, ${Math.floor(60 + avgEnergy * 30)}%, ${Math.floor(40 + avgValence * 30)}%)`
  ];
  
  // Use timestamp and user data for unique seed generation
  // Garantir que cada login gere uma imagem única usando o timestamp preciso
  const timestamp = userData.timestamp || Date.now();
  
  // Create uniqueness factors using profile data, prime numbers, and login timestamp
  // Using prime multipliers to create unique distribution
  const uniquenessFactors = [
    avgEnergy * 17.31,
    avgValence * 19.47,
    avgDanceability * 23.89,
    avgAcousticness * 29.71,
    (avgTempos / 200) * 31.37,
    (userData.id.charCodeAt(0) % 100) / 100 * 37.43,
    (timestamp % 10000) / 10000 * 41.59
  ];
  
  // Create a high-precision unique score (0-100)
  // Implementação do cálculo do score musical conforme solicitado no prompt
  const uniqueScore = Math.floor(
    uniquenessFactors.reduce((acc, factor) => (acc + factor) % 100, 0)
  );
  
  // Calculate high precision seed for image generation
  // Incorporar o timestamp de login para garantir que cada login gere uma imagem diferente
  const highPrecisionSeed = uniquenessFactors.reduce((sum, factor) => sum + factor * Math.PI, 0) + timestamp;
  
  // Normalize to a stable range but keep high precision
  const normalizedSeed = Math.abs(Math.sin(highPrecisionSeed)) * 9999999999;
  
  // Log para debug
  console.log(`Gerando índice musical único com timestamp: ${timestamp}`);
  console.log(`Seed para imagem: ${normalizedSeed}`);
  console.log(`Score musical calculado: ${uniqueScore}`);
  
  return {
    energy: avgEnergy,
    valence: avgValence,
    danceability: avgDanceability,
    acousticness: avgAcousticness,
    topGenres,
    uniqueScore,
    colorPalette,
    imageSeed: normalizedSeed
  };
};
