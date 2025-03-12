
# Gerador de imagem Perlin Noise para YourMusicImage

import os
import random
import json
import math
import time
from datetime import datetime
import numpy as np
from PIL import Image, ImageDraw
from perlin_noise import PerlinNoise

# Configuração do diretório de saída
OUTPUT_DIR = "/Users/thiago/Desktop/GitHuszar/YourMusicImge"

# Garantir que o diretório exista
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)
    print(f"Criado diretório de saída: {OUTPUT_DIR}")

def generate_perlin_image(user_id, music_data, output_dir=OUTPUT_DIR):
    """
    Gera uma imagem abstrata baseada em dados musicais usando ruído Perlin
    
    Args:
        user_id: ID único do usuário
        music_data: Dicionário com dados musicais (energy, valence, danceability, acousticness)
        output_dir: Diretório onde a imagem será salva
    
    Returns:
        String com o caminho da imagem gerada
    """
    width, height = 500, 500
    img = Image.new("RGB", (width, height), "black")
    draw = ImageDraw.Draw(img)
    
    # Extrair dados musicais
    energy = music_data.get("energy", 0.5)
    valence = music_data.get("valence", 0.5)
    danceability = music_data.get("danceability", 0.5)
    acousticness = music_data.get("acousticness", 0.3)
    
    # Criar seed de alta precisão
    timestamp = time.time()
    random_seed = int(timestamp * 1000000) % 10000000000
    
    # Incorporar características musicais na seed para maior unicidade
    seed_value = random_seed + int(energy * 10000) + int(valence * 20000) + int(danceability * 30000) + int(acousticness * 40000)
    
    # Criar múltiplas camadas de ruído com diferentes oitavas para mais detalhe
    noise1 = PerlinNoise(octaves=3, seed=int(seed_value % 1000000000))
    noise2 = PerlinNoise(octaves=6, seed=int((seed_value + 1) % 1000000000))
    noise3 = PerlinNoise(octaves=12, seed=int((seed_value + 2) % 1000000000))
    
    # Gerar uma paleta de cores baseada nos atributos musicais
    color_palette = [
        (int(valence * 255), int(energy * 200), int(255 - acousticness * 200)),
        (int(energy * 255), int(danceability * 200), int(acousticness * 255)),
        (int(255 - energy * 100), int(valence * 255), int(danceability * 200)),
    ]
    
    # Aplicar ruído Perlin multicamada com cores baseadas no perfil musical
    for x in range(width):
        for y in range(height):
            nx, ny = x/width, y/height
            
            # Combinar múltiplas oitavas de ruído
            noise_val = (
                1.0 * noise1([nx, ny]) +
                0.5 * noise2([nx * 2, ny * 2]) +
                0.25 * noise3([nx * 4, ny * 4])
            )
            
            # Normalizar o valor
            noise_val = (noise_val + 1) / 2
            
            # Escolher cor com base no valor do ruído
            if noise_val < 0.33:
                color_idx = 0
            elif noise_val < 0.66:
                color_idx = 1
            else:
                color_idx = 2
                
            # Ajustar intensidade de cor com base no valor do ruído
            color_intensity = noise_val ** valence if valence > 0 else noise_val
            r, g, b = color_palette[color_idx]
            r = int(r * color_intensity)
            g = int(g * color_intensity)
            b = int(b * color_intensity)
            
            draw.point((x, y), (r, g, b))
    
    # Adicionar detalhes baseados no valor de energia
    if energy > 0.6:
        for i in range(5):
            cx = int(width * (0.3 + (seed_value + i * 100) % 1000 / 1000 * 0.4))
            cy = int(height * (0.3 + (seed_value + i * 200) % 1000 / 1000 * 0.4))
            radius = int(50 + energy * 50)
            
            # Criar um gradiente radial à mão
            for rx in range(cx - radius, cx + radius):
                for ry in range(cy - radius, cy + radius):
                    if 0 <= rx < width and 0 <= ry < height:
                        # Calcular distância do centro
                        dist = math.sqrt((rx - cx) ** 2 + (ry - cy) ** 2)
                        if dist < radius:
                            # Criar efeito gradiente
                            factor = 1 - (dist / radius)
                            r, g, b = img.getpixel((rx, ry))
                            blend_color = color_palette[i % 3]
                            new_r = int(r * (1 - factor) + blend_color[0] * factor)
                            new_g = int(g * (1 - factor) + blend_color[1] * factor)
                            new_b = int(b * (1 - factor) + blend_color[2] * factor)
                            draw.point((rx, ry), (new_r, new_g, new_b))
    
    # Adicionar padrões baseados em danceability
    if danceability > 0.7:
        # Adicionar padrões rítmicos para músicas dançantes
        line_count = int(5 + danceability * 10)
        spacing = width / line_count
        
        for i in range(line_count):
            if (seed_value + i) % 2 == 0:
                # Linhas horizontais rítmicas
                y_pos = i * spacing
                draw.line([(0, y_pos), (width, y_pos)], fill=(255, 255, 255, 30), width=1)
            else:
                # Linhas verticais rítmicas
                x_pos = i * spacing
                draw.line([(x_pos, 0), (x_pos, height)], fill=(255, 255, 255, 30), width=1)
    
    # Guardar dados do usuário como metadados na imagem
    metadata = {
        "user_id": user_id,
        "energy": energy,
        "valence": valence,
        "danceability": danceability,
        "acousticness": acousticness,
        "timestamp": datetime.now().isoformat()
    }
    
    # Salvar a imagem com nome baseado no ID do usuário
    img_path = f"{output_dir}/{user_id}.png"
    img.save(img_path)
    
    # Salvar metadados separadamente
    with open(f"{output_dir}/{user_id}_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Imagem gerada para {user_id} em {img_path}")
    return img_path

def create_demo_visualization():
    """
    Cria uma visualização demo com diferentes perfis musicais
    """
    # Criar diferentes perfis musicais para demonstração
    profiles = [
        {"name": "Música Energética", "energy": 0.9, "valence": 0.8, "danceability": 0.85, "acousticness": 0.1},
        {"name": "Música Calma", "energy": 0.2, "valence": 0.6, "danceability": 0.3, "acousticness": 0.8},
        {"name": "Música Feliz", "energy": 0.6, "valence": 0.9, "danceability": 0.7, "acousticness": 0.4},
        {"name": "Música Triste", "energy": 0.4, "valence": 0.2, "danceability": 0.4, "acousticness": 0.6}
    ]
    
    # Gerar imagem para cada perfil
    for i, profile in enumerate(profiles):
        user_id = f"demo_user_{i+1}"
        generate_perlin_image(user_id, profile)
        print(f"Gerada visualização para '{profile['name']}'")

# Executar o código
if __name__ == "__main__":
    print("Iniciando gerador de imagens YourMusicImage...")
    
    # Criar visualizações de demonstração
    create_demo_visualization()
    
    # Também criar uma imagem para um usuário "atual" com perfil aleatório
    current_user_profile = {
        "energy": random.uniform(0.3, 0.9),
        "valence": random.uniform(0.2, 0.95),
        "danceability": random.uniform(0.4, 0.85),
        "acousticness": random.uniform(0.1, 0.8)
    }
    
    current_user_id = f"current_user_{int(time.time())}"
    img_path = generate_perlin_image(current_user_id, current_user_profile)
    
    print("\nProcesso concluído!")
    print(f"Imagens geradas e salvas em: {OUTPUT_DIR}")
    print(f"Imagem do usuário atual: {img_path}")
    print(f"Perfil musical do usuário atual: {current_user_profile}")
