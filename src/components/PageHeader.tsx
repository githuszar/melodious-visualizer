
const PageHeader = () => {
  return (
    <div className="mx-auto max-w-4xl text-center mb-12 animate-fade-in">
      <span className="text-xs font-medium text-spotify bg-spotify/10 rounded-full px-3 py-1">Sua Identidade Musical</span>
      <h1 className="mt-3 text-4xl font-bold">Sua Visualização Musical Única</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
        Baseado no seu histórico de audição do Spotify, criamos uma visualização única de impressão digital de áudio apenas para você.
      </p>
    </div>
  );
};

export default PageHeader;
