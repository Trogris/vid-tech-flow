import React from 'react';
import { Download, RotateCcw, User, Hash, FileText, Clock, Monitor, HardDrive, Image, BarChart3 } from 'lucide-react';

interface ResultadosRelatorioProps {
  formData: {
    nomeTecnico: string;
    numeroSerie: string;
    contrato: string;
  };
  results: {
    frames: string[];
    analysis: {
      duration: number;
      frameCount: number;
      resolution: string;
      fileSize: string;
    };
  };
  onNewAnalysis: () => void;
}

const ResultadosRelatorio: React.FC<ResultadosRelatorioProps> = ({
  formData,
  results,
  onNewAnalysis
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDownloadReport = () => {
    // Simula o download do relatório ZIP
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `relatorio_video_${formData.numeroSerie}_${timestamp}.zip`;
    
    // Cria um blob simulado (na implementação real, seria o ZIP com frames e relatório)
    const reportData = {
      tecnico: formData.nomeTecnico,
      numeroSerie: formData.numeroSerie,
      contrato: formData.contrato,
      analise: results.analysis,
      timestamp: new Date().toISOString(),
      frames: results.frames.length
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 animate-fade-in">
      <div className="max-w-4xl mx-auto pt-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-success-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Relatório de Análise
          </h1>
          <p className="text-muted-foreground">
            Análise completa do vídeo técnico
          </p>
        </div>

        {/* Resumo dos dados do técnico */}
        <div className="card-soft p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Dados do Técnico
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Técnico</p>
                <p className="font-medium text-foreground">{formData.nomeTecnico}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Hash className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Série</p>
                <p className="font-medium text-foreground">{formData.numeroSerie}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Contrato</p>
                <p className="font-medium text-foreground">{formData.contrato}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Análise do vídeo */}
        <div className="card-soft p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Análise do Vídeo
          </h2>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="font-medium text-foreground">{formatDuration(results.analysis.duration)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Monitor className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Resolução</p>
                <p className="font-medium text-foreground">{results.analysis.resolution}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <HardDrive className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Tamanho</p>
                <p className="font-medium text-foreground">{results.analysis.fileSize}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Image className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Frames</p>
                <p className="font-medium text-foreground">{results.analysis.frameCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Galeria de frames */}
        <div className="card-soft p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Image className="w-5 h-5" />
            Frames Extraídos
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {results.frames.map((frame, index) => (
              <div key={index} className="group relative">
                <img
                  src={frame}
                  alt={`Frame ${index + 1}`}
                  className="w-full aspect-video object-cover rounded-lg border border-border 
                           group-hover:shadow-lg transition-all duration-300 cursor-pointer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 
                              rounded-lg transition-all duration-300 flex items-center justify-center">
                  <span className="text-white font-medium opacity-0 group-hover:opacity-100 
                                 transition-opacity duration-300">
                    Frame {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleDownloadReport}
            className="btn-success flex items-center justify-center gap-2 px-8"
          >
            <Download className="w-5 h-5" />
            Download Relatório ZIP
          </button>
          
          <button
            onClick={onNewAnalysis}
            className="btn-secondary flex items-center justify-center gap-2 px-8"
          >
            <RotateCcw className="w-5 h-5" />
            Nova Análise
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultadosRelatorio;