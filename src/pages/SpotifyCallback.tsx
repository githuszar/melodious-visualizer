
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleSpotifyCallback } from "@/services/spotifyAuth";
import { Music } from "lucide-react";
import { toast } from "sonner";

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        console.log("Processando callback do Spotify...");
        const success = await handleSpotifyCallback();
        
        if (success) {
          console.log("Autenticação bem-sucedida, redirecionando para home...");
          toast.success("Autenticação com Spotify concluída!");
          // Adicionar pequeno delay antes do redirecionamento para garantir que os dados sejam salvos
          setTimeout(() => {
            console.log("Redirecionando para a página inicial após autenticação bem-sucedida");
            navigate("/");
          }, 1500);
        } else {
          console.error("Falha na autenticação do Spotify");
          setError("Falha na autenticação. Por favor, tente novamente.");
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (err) {
        console.error("Erro ao processar callback:", err);
        setError("Ocorreu um erro inesperado. Por favor, tente novamente.");
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
          <Music className={`h-10 w-10 text-spotify ${isProcessing ? 'animate-spin' : ''}`} />
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
