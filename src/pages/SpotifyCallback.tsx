
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleSpotifyCallback } from "@/services/spotify";
import { Music } from "lucide-react";
import { toast } from "sonner";

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log("[SpotifyCallback] Iniciando processamento de callback");
        console.log("[SpotifyCallback] URL completa:", window.location.href);
        
        // Extrair e logar parâmetros da URL para debug
        const params = new URLSearchParams(window.location.search);
        console.log("[SpotifyCallback] Parâmetros da URL:");
        console.log("[SpotifyCallback] - code presente:", !!params.get('code'));
        if (params.get('code')) {
          const code = params.get('code')!;
          console.log("[SpotifyCallback] - Tamanho do código:", code.length);
          console.log("[SpotifyCallback] - Amostra do código:", code.substring(0, 5) + "..." + code.substring(code.length - 5));
        }
        console.log("[SpotifyCallback] - state presente:", !!params.get('state'));
        console.log("[SpotifyCallback] - error:", params.get('error') || "nenhum");
        
        if (params.get('error')) {
          console.error("[SpotifyCallback] Erro retornado pelo Spotify:", params.get('error'));
          setError(`Erro retornado pelo Spotify: ${params.get('error')}`);
          setTimeout(() => navigate("/"), 3000);
          return;
        }
        
        // Verificar estado do localStorage antes de processar o callback
        console.log("[SpotifyCallback] Estado do localStorage antes do processamento:");
        const storedState = localStorage.getItem("spotify_auth_state");
        console.log("[SpotifyCallback] - Estado armazenado presente:", !!storedState);
        
        const success = await handleSpotifyCallback();
        
        // Verificar estado do localStorage após processar o callback
        console.log("[SpotifyCallback] Estado do localStorage após processamento:");
        const token = localStorage.getItem("spotify_token");
        const tokenExpiry = localStorage.getItem("spotify_token_expiry");
        console.log("[SpotifyCallback] - Token presente:", !!token);
        console.log("[SpotifyCallback] - Expiração do token presente:", !!tokenExpiry);
        if (tokenExpiry) {
          const expiryDate = new Date(parseInt(tokenExpiry));
          console.log("[SpotifyCallback] - Token expira em:", expiryDate.toISOString());
        }
        
        if (success) {
          console.log("[SpotifyCallback] Autenticação bem-sucedida, redirecionando para home...");
          toast.success("Autenticação com Spotify concluída!");
          // Adicionar pequeno delay antes do redirecionamento para garantir que os dados sejam salvos
          setTimeout(() => {
            console.log("[SpotifyCallback] Redirecionando para a página inicial após autenticação bem-sucedida");
            navigate("/");
          }, 1500);
        } else {
          console.error("[SpotifyCallback] Falha na autenticação do Spotify");
          
          // Verificar local storage para possíveis pistas sobre a falha
          console.log("[SpotifyCallback] Verificando localStorage para debug:");
          console.log("[SpotifyCallback] - Estado armazenado presente:", !!storedState);
          console.log("[SpotifyCallback] - Token armazenado presente:", !!token);
          
          // Tentar identificar o tipo de falha
          if (!storedState && params.get('state')) {
            setError("Falha na autenticação: estado de sessão perdido. Por favor, tente novamente e não atualize a página durante o processo.");
          } else if (params.get('code') && !token) {
            setError("Falha na obtenção de token do Spotify. Por favor, verifique suas credenciais e tente novamente.");
          } else {
            setError("Falha na autenticação. Por favor, tente novamente.");
          }
          
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (err) {
        console.error("[SpotifyCallback] Erro ao processar callback:", err);
        if (err instanceof Error) {
          console.error("[SpotifyCallback] Mensagem de erro:", err.message);
          setError(`Ocorreu um erro inesperado: ${err.message}`);
        } else {
          setError("Ocorreu um erro inesperado. Por favor, tente novamente.");
        }
        setTimeout(() => navigate("/"), 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="glass-panel p-8 max-w-md w-full text-center animate-fade-in">
        <div className="bg-spotify/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Music className={`h-10 w-10 text-spotify ${isProcessing ? 'animate-pulse' : ''}`} />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          {isProcessing ? "Conectando ao Spotify..." : error ? "Falha na Conexão" : "Conectado com Sucesso!"}
        </h1>
        
        <p className="text-muted-foreground mb-4">
          {isProcessing 
            ? "Por favor, aguarde enquanto processamos sua autenticação com o Spotify..." 
            : error 
              ? error 
              : "Redirecionando para sua visualização musical pessoal..."}
        </p>
        
        {isProcessing && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
            <div className="bg-spotify h-2.5 rounded-full animate-pulse w-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyCallback;
