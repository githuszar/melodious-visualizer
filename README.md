
# YourMusicImage

Uma aplicação web que gera uma visualização única e abstrata com base no seu perfil musical do Spotify.

## Configuração

1. Credenciais do Spotify já estão configuradas:
   - CLIENT_ID: "e983ab76967541819658cb3126d9f3df"
   - CLIENT_SECRET: "4f4d1a7a3697434db2a0edc2c484f80c"
   - REDIRECT_URI: "https://your-music-image.lovable.app/callback"

2. A aplicação usa armazenamento local para persistir os dados do usuário e as imagens geradas.

3. Para desenvolvimento local, você pode executar:
   ```
   npm install
   npm run dev
   ```

## Funcionalidades

- Autenticação via Spotify
- Análise do perfil musical do usuário
- Geração de um índice musical único
- Criação de uma visualização abstrata baseada no perfil musical
- Compartilhamento e download da imagem gerada
- Salvar localmente no diretório `/Users/thiago/Desktop/GitHuszar/YourMusicImge`

## Tecnologias

- React
- TypeScript
- Tailwind CSS
- API do Spotify
- Perlin Noise para geração de imagens

## Endpoints da API do Spotify utilizados

- Perfil do Usuário: `https://api.spotify.com/v1/me`
- Top Artistas: `https://api.spotify.com/v1/me/top/artists`
- Top Músicas: `https://api.spotify.com/v1/me/top/tracks`
- Características de Áudio: `https://api.spotify.com/v1/audio-features`

## Próximos passos

- Implementar backend para armazenamento persistente
- Melhorar o algoritmo de geração de imagens
- Adicionar mais opções de compartilhamento
- Criar galeria pública de visualizações
