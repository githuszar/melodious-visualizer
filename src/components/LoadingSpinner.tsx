
import { Music } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="relative w-16 h-16 animate-spin">
        <Music className="w-full h-full text-spotify" />
      </div>
      <p className="mt-4 text-lg">Carregando seu perfil musical...</p>
    </div>
  );
};

export default LoadingSpinner;
