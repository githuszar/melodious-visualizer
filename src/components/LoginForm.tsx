
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, SparklesIcon } from "lucide-react";
import { initiateSpotifyLogin } from "@/services/spotifyAuth";

interface LoginFormProps {
  errorMessage?: string | null;
}

const LoginForm: React.FC<LoginFormProps> = ({ errorMessage }) => {
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Bem-vindo ao Visualizador Musical</CardTitle>
          <CardDescription>
            Conecte sua conta do Spotify para ver sua impressão digital musical única
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2 text-center">
            <SparklesIcon className="mx-auto h-12 w-12 text-spotify" />
            <p className="text-sm text-muted-foreground">
              Descubra sua visualização única baseada em seu perfil musical e gêneros preferidos
            </p>
          </div>
          
          <Button 
            className="w-full bg-spotify hover:bg-spotify/90"
            onClick={initiateSpotifyLogin}
          >
            Conectar com Spotify
          </Button>
          
          <Separator />
          
          <div className="text-xs text-center text-muted-foreground">
            <p>
              Este aplicativo utiliza a API do Spotify para criar uma visualização única do seu perfil musical.
              Ao conectar, você concede acesso apenas às suas preferências musicais e dados públicos do perfil.
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          <p className="text-xs text-muted-foreground text-center w-full">
            Seus dados são armazenados apenas localmente e nunca são compartilhados.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginForm;
