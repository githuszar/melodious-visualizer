
# YourMusicImage

Uma aplicação web que gera uma visualização única e abstrata com base no seu perfil musical do Spotify.

## Configuração

1. Credenciais do Spotify já estão configuradas:
   - CLIENT_ID: "e983ab76967541819658cb3126d9f3df"
   - CLIENT_SECRET: "4f4d1a7a3697434db2a0edc2c484f80c"
   - REDIRECT_URI: Usa automaticamente a origem da aplicação + "/callback"

2. A aplicação usa armazenamento local (localStorage) para persistir os dados do usuário e as imagens geradas:
   - Chave para dados do usuário: "music_user_data"
   - Chave para imagem gerada: "music_image"

3. Para desenvolvimento local, você pode executar:
   ```
   npm install
   npm run dev
   ```

4. Para build de produção:
   ```
   npm run build
   ```

## Funcionalidades

- Autenticação via Spotify
- Análise do perfil musical do usuário
- Geração de um índice musical único
- Criação de uma visualização abstrata baseada no perfil musical
- Compartilhamento e download da imagem gerada

## Tecnologias

- React
- TypeScript
- Tailwind CSS
- API do Spotify
- Perlin Noise para geração de imagens
- LocalStorage para armazenamento temporário

## Endpoints da API do Spotify utilizados

- Perfil do Usuário: `https://api.spotify.com/v1/me`
- Top Artistas: `https://api.spotify.com/v1/me/top/artists`
- Top Músicas: `https://api.spotify.com/v1/me/top/tracks`
- Características de Áudio: `https://api.spotify.com/v1/audio-features`

## Armazenamento de imagens

- As imagens geradas são armazenadas no localStorage com a chave "music_image"
- Caminho no LocalStorage: key "music_image", armazena o DataURL da imagem gerada
- Opção para download direto disponível através da função `downloadImage` no serviço `dataStorage.ts`
- Preparado para futura integração com Firebase Storage

## Deploy e Publicação

Para publicar no GitHub Pages ou outro serviço de hospedagem estática:

1. Crie um build de produção com `npm run build`
2. Configure seu serviço de hospedagem para lidar com rotas SPA (Single Page Application)
3. Certifique-se de que todas as requisições para rotas inexistentes sejam redirecionadas para o index.html

## Próximos passos

- Implementar integração com Firebase para armazenamento persistente
- Melhorar o algoritmo de geração de imagens
- Adicionar mais opções de compartilhamento
- Criar galeria pública de visualizações
